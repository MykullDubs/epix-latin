// src/components/LiveVocabProjector.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLiveClass } from '../hooks/useLiveClass';
import { 
    Users, Timer, Zap, ArrowRight, X, Trophy, CheckCircle2, 
    Settings, Hand, Crown, Activity, Target, Shield, Flame, Loader2 
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, appId } from '../config/firebase';

export default function LiveVocabProjector({ deck, classId, activeClass, onExit }: any) {
    const { liveState, startLiveClass, endLiveClass, changeSlide, triggerQuiz } = useLiveClass(classId, true);
    
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPilot, setIsAutoPilot] = useState(false);
    const [isFinished, setIsFinished] = useState(false); 
    const [isBooting, setIsBooting] = useState(true); 
    
    const scoresRef = useRef<{ [email: string]: number }>({});
    const [gameSettings, setGameSettings] = useState({ qTime: 15, rTime: 6 });
    const [timeLeft, setTimeLeft] = useState(gameSettings.qTime);
    
    const timerRef = useRef<any>(null);
    const safeDeckId = deck?.id || deck?.key || 'custom_vocab_run';

    const liveStateRef = useRef(liveState);
    const currentIndexRef = useRef(currentIndex);

    useEffect(() => { liveStateRef.current = liveState; }, [liveState]);
    useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);

    // System Boot Sequence
    useEffect(() => {
        const timer = setTimeout(() => setIsBooting(false), 2000);
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

    // Auto-skip logic
    useEffect(() => {
        if (liveState?.quizState === 'active' && isAutoPilot) {
            const currentAnswers = Object.keys(liveState?.answers || {}).length;
            const joinedStudentsCount = Object.keys(liveState?.joined || {}).length;
            if (joinedStudentsCount > 0 && currentAnswers >= joinedStudentsCount) {
                setTimeLeft(0); 
            }
        }
    }, [liveState?.answers, liveState?.joined, isAutoPilot, liveState?.quizState]);

    // Timer Ticker
    useEffect(() => {
        if (!isAutoPilot || isFinished || isBooting || timeLeft <= 0) return;
        const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [isAutoPilot, isFinished, isBooting, timeLeft]);

    // Phase Switcher
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
            updateDoc(doc(db, 'artifacts', appId, 'live_sessions', classId), { 
                quizState: 'active',
                currentQuestion: questionPayload, 
                answers: {}, 
                answerTimes: {}, 
                roundPoints: {} 
            });
        } else {
            setIsFinished(true);
            updateDoc(doc(db, 'artifacts', appId, 'live_sessions', classId), { quizState: 'finished', finalScores: scoresRef.current });
        }
    };

    const startRun = async (auto: boolean) => {
        setIsAutoPilot(auto);
        setTimeLeft(gameSettings.qTime);
        setCurrentIndex(0);
        const qPayload = { ...quizQuestions[0], startTime: Date.now(), timeLimit: gameSettings.qTime * 1000 };
        
        // 🔥 FORCE UPDATE TO FIREBASE TO TRIGGER STUDENT DEVICES
        const sessionRef = doc(db, 'artifacts', appId, 'live_sessions', classId);
        await updateDoc(sessionRef, { 
            quizState: 'active',
            currentQuestion: qPayload, 
            answers: {}, 
            answerTimes: {}, 
            roundPoints: {}, 
            finalScores: {} 
        });

        changeSlide(0, qPayload);
        triggerQuiz('active');
        scoresRef.current = {};
    };

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

    if (isBooting) {
        return (
            <div className="h-full bg-black flex flex-col items-center justify-center font-mono text-indigo-500 overflow-hidden">
                <div className="space-y-4 animate-pulse text-center">
                    <p className="text-xs tracking-[0.5em] uppercase opacity-50">Initializing Magister OS...</p>
                    <h2 className="text-5xl font-black tracking-tighter text-white uppercase italic">Vocabulary Protocol</h2>
                    <div className="w-64 h-1.5 bg-slate-900 mx-auto rounded-full mt-8 overflow-hidden">
                        <div className="h-full bg-indigo-500 animate-slide-infinite w-1/2" />
                    </div>
                </div>
            </div>
        );
    }

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
                <Trophy size={100} className="text-yellow-400 mx-auto mb-8 animate-bounce-slow drop-shadow-[0_0_50px_rgba(250,204,21,0.5)]" />
                <h1 className="text-8xl font-black uppercase tracking-tighter italic mb-20">Protocol Over</h1>
                <div className="flex justify-center items-end gap-6 mb-20 h-72 border-b-2 border-slate-900 w-full max-w-4xl">
                    {sortedScores[1] && <div className="flex flex-col items-center w-1/3"><div className="text-xl font-black mb-4 text-slate-400">{sortedScores[1].name}</div><div className="w-full h-32 bg-slate-900 rounded-t-3xl pt-8 text-center"><span className="text-3xl font-black">{sortedScores[1].score}</span></div></div>}
                    {sortedScores[0] && <div className="flex flex-col items-center w-1/3"><Crown className="text-yellow-400 mb-2"/><div className="text-3xl font-black mb-4 text-yellow-400">{sortedScores[0].name}</div><div className="w-full h-48 bg-slate-900 rounded-t-[3rem] pt-12 text-center border-t-4 border-yellow-400"><span className="text-5xl font-black">{sortedScores[0].score}</span></div></div>}
                    {sortedScores[2] && <div className="flex flex-col items-center w-1/3"><div className="text-xl font-black mb-4 text-amber-700">{sortedScores[2].name}</div><div className="w-full h-24 bg-slate-900 rounded-t-3xl pt-6 text-center"><span className="text-3xl font-black">{sortedScores[2].score}</span></div></div>}
                </div>
                <button onClick={onExit} className="bg-white text-black px-12 py-5 rounded-full font-black text-xl hover:scale-105 active:scale-95 transition-all">Close Session</button>
            </div>
        );
    }

    // ========================================================================
    //  RENDER: LOBBY (REPAIRED CLICK LOGIC)
    // ========================================================================
    if (!liveState?.quizState || liveState?.quizState === 'waiting') {
        const joinedStudents = liveState?.joined || {};
        const joinedCount = Object.keys(joinedStudents).length;

        return (
            <div className="h-full bg-black text-white flex flex-col relative overflow-hidden font-sans">
                {/* Background Decor */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/30 via-black to-black pointer-events-none z-0" />
                
                {/* Header */}
                <header className="flex items-center justify-between z-20 p-10 shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-2xl animate-pulse"><Zap size={32} fill="white" /></div>
                        <div>
                            <h3 className="font-black text-3xl uppercase tracking-tighter">{deck.title || 'Magister Deck'}</h3>
                            <p className="text-xs text-indigo-400 font-black uppercase tracking-[0.4em] flex items-center gap-2"><Shield size={12} /> {activeClass?.name || 'Fleet'} Protocol</p>
                        </div>
                    </div>
                </header>

                {/* Main Lobby Layout */}
                <main className="flex-1 grid grid-cols-12 gap-8 px-10 pb-10 z-10 overflow-hidden">
                    
                    {/* LEFT: Fleet Radar */}
                    <div className="col-span-8 bg-slate-900/30 border-2 border-slate-800/50 rounded-[3.5rem] flex flex-col backdrop-blur-xl relative overflow-hidden">
                        <div className="p-10 flex items-center justify-between border-b border-slate-800/50 shrink-0">
                            <h1 className="text-5xl font-black uppercase tracking-tighter italic">Arena Lobby</h1>
                            <div className="bg-emerald-500/10 border border-emerald-500/30 px-8 py-4 rounded-[2rem] text-center">
                                <span className="block text-4xl font-black text-emerald-400 leading-none">{joinedCount}</span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500/60">Scholars Syncing</span>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-8">
                            {activeClass?.students?.map((s: any, i: number) => {
                                const isConnected = !!joinedStudents[s.email.replace(/\./g, ',')];
                                return (
                                    <div key={i} className={`flex flex-col items-center gap-3 transition-all duration-700 ${isConnected ? 'opacity-100 scale-110' : 'opacity-20 grayscale'}`}>
                                        <div className={`w-20 h-20 rounded-[2rem] border-2 flex items-center justify-center text-3xl font-black ${isConnected ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_30px_rgba(79,70,229,0.4)]' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                                            {(s.name?.[0] || s.email[0]).toUpperCase()}
                                        </div>
                                        <span className="text-[10px] font-black uppercase truncate w-20 text-center text-slate-400">{s.name || s.email.split('@')[0]}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* RIGHT: High-Response Launch Pad */}
                    <div className="col-span-4 flex flex-col">
                        <div className="flex-1 bg-slate-900/40 border-2 border-slate-800 rounded-[3.5rem] p-10 flex flex-col items-center justify-center text-center shadow-2xl relative z-30">
                            <Target size={60} className="text-indigo-500/30 mb-6" />
                            <h2 className="text-xl font-black uppercase tracking-widest mb-10 text-slate-500">Execution Mode</h2>
                            
                            <div className="w-full space-y-4">
                                <button 
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); startRun(true); }}
                                    className="w-full py-8 bg-white text-black rounded-[2.5rem] font-black text-3xl uppercase tracking-tighter hover:bg-slate-100 active:scale-95 transition-all shadow-[0_0_50px_rgba(255,255,255,0.1)] cursor-pointer relative z-50 flex items-center justify-center gap-4"
                                >
                                    <Zap size={28} fill="black" /> Auto-Pilot
                                </button>

                                <button 
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); startRun(false); }}
                                    className="w-full py-6 bg-slate-800 text-white rounded-[2rem] font-black text-xl uppercase tracking-widest hover:bg-slate-700 active:scale-95 transition-all border-2 border-slate-700 cursor-pointer relative z-50 flex items-center justify-center gap-3"
                                >
                                    <Hand size={24} /> Manual Mode
                                </button>
                            </div>

                            {joinedCount === 0 && (
                                <p className="mt-8 text-xs font-bold text-rose-500 uppercase tracking-widest animate-pulse">Awaiting first signal...</p>
                            )}
                        </div>
                    </div>
                </main>

                <button onClick={onExit} className="absolute top-10 right-10 text-slate-700 hover:text-rose-500 transition-colors z-50"><X size={40} /></button>
            </div>
        );
    }

    // ========================================================================
    //  RENDER: ACTIVE GAME
    // ========================================================================
    const answers = liveState?.answers || {};
    const answerCount = Object.keys(answers).length;
    const joinedStudents = liveState?.joined || {};
    const joinedCount = Math.max(1, Object.keys(joinedStudents).length);
    const progressPct = (answerCount / joinedCount) * 100;
    const currentQ = quizQuestions[currentIndex];

    return (
        <div className="h-full bg-black text-white font-sans flex flex-col overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-black to-black pointer-events-none" />
            
            <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-900 z-50">
                <div className="h-full bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.8)] transition-all duration-1000 ease-linear"
                    style={{ width: `${(timeLeft / (liveState?.quizState === 'revealed' ? gameSettings.rTime : gameSettings.qTime)) * 100}%` }} />
            </div>

            <main className="flex-1 grid grid-cols-12 gap-6 p-8 relative z-10 overflow-hidden">
                <div className="col-span-3 bg-slate-900/40 border-2 border-slate-800/60 rounded-[3rem] p-8 flex flex-col backdrop-blur-md">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] mb-8 opacity-50 flex items-center gap-2"><Activity size={16}/> Fleet Manifest</h2>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                        {activeClass?.students?.map((s: any, i: number) => {
                            const safeEmail = s.email.replace(/\./g, ',');
                            if (!joinedStudents[safeEmail]) return null;
                            const hasAnswered = !!answers[safeEmail];
                            return (
                                <div key={i} className={`flex items-center gap-4 p-3 rounded-2xl border transition-all ${hasAnswered ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/30 border-slate-800'}`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${hasAnswered ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-slate-800 text-slate-500'}`}>{(s.name?.[0] || s.email[0]).toUpperCase()}</div>
                                    <div className="flex-1 min-w-0"><p className={`text-[11px] font-black uppercase truncate ${hasAnswered ? 'text-emerald-400' : 'text-slate-400'}`}>{s.name || s.email.split('@')[0]}</p></div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="col-span-6 flex flex-col items-center justify-center text-center px-12 relative">
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20 mb-12">Target {currentIndex + 1} / {quizQuestions.length}</span>
                    <h2 className="text-8xl md:text-9xl font-black tracking-tighter uppercase italic drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] mb-4">{currentQ.question}</h2>
                    {currentQ.ipa && <p className="text-2xl font-mono text-indigo-400 opacity-60 tracking-widest">{currentQ.ipa}</p>}

                    {liveState?.quizState === 'active' && (
                        <div className="mt-16 w-full max-w-md">
                            <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700 shadow-inner">
                                <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${progressPct}%` }} />
                            </div>
                            <div className="flex justify-between mt-4">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{answerCount} Responses</span>
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{Math.round(progressPct)}% Sync</span>
                            </div>
                            {!isAutoPilot && <button onClick={handleReveal} className="mt-12 bg-white text-black px-12 py-5 rounded-full font-black text-xl uppercase tracking-tighter hover:scale-105 active:scale-95 transition-all shadow-xl">Reveal Protocol</button>}
                        </div>
                    )}

                    {liveState?.quizState === 'revealed' && (
                        <div className="mt-16 animate-in zoom-in-95 duration-500">
                            <div className="bg-emerald-500 text-white px-16 py-8 rounded-[2.5rem] text-5xl font-black border-4 border-emerald-400 shadow-[0_0_60px_rgba(16,185,129,0.4)]">
                                {currentQ.options.find((o:any) => o.id === currentQ.correctId)?.text}
                            </div>
                            {!isAutoPilot && <button onClick={handleNext} className="mt-12 flex items-center gap-4 text-slate-500 hover:text-white font-black text-xl uppercase tracking-widest transition-all mx-auto">{currentIndex < quizQuestions.length - 1 ? 'Next Target' : 'Final Rankings'} <ArrowRight /></button>}
                        </div>
                    )}
                </div>

                <div className="col-span-3 bg-slate-900/40 border-2 border-slate-800/60 rounded-[3rem] p-8 flex flex-col backdrop-blur-md">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] mb-8 opacity-50 flex items-center gap-2"><Flame size={16} className="text-orange-500"/> Live XP Pulse</h2>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                        {roundScores.map((log: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-slate-800/20 border border-slate-800 rounded-2xl animate-in slide-in-from-right-4">
                                <span className="text-[11px] font-black uppercase text-slate-300">{log.name}</span>
                                <span className="text-[10px] font-black text-emerald-400">+{log.points} XP</span>
                            </div>
                        ))}
                    </div>
                    {isAutoPilot && (
                        <div className="mt-8 pt-8 border-t border-slate-800 text-center">
                            <div className={`text-6xl font-black tabular-nums transition-all ${timeLeft <= 5 && liveState?.quizState !== 'revealed' ? 'text-rose-500 animate-pulse scale-110' : 'text-slate-700'}`}>{timeLeft}s</div>
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{liveState?.quizState === 'revealed' ? 'Next Round' : 'Remaining'}</span>
                        </div>
                    )}
                </div>
            </main>

            <button onClick={onExit} className="absolute top-10 right-10 text-slate-700 hover:text-rose-500 transition-colors z-50"><X size={32} /></button>
        </div>
    );
}
