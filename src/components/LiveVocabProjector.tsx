// src/components/LiveVocabProjector.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLiveClass } from '../hooks/useLiveClass';
import { useArenaAudio } from '../hooks/useArenaAudio'; // 🔥 IMPORTED AUDIO ENGINE
import { 
    Users, Timer, Zap, ArrowRight, X, Trophy, CheckCircle2, 
    Settings, Hand, Crown, Activity, Target, Shield, Flame, Loader2, QrCode 
} from 'lucide-react';
import { doc, updateDoc, collection, getDocs } from 'firebase/firestore'; 
import { db, appId } from '../config/firebase';
import HoloAvatar from './HoloAvatar';

export default function LiveVocabProjector({ deck, classId, activeClass, onExit }: any) {
    const { liveState, startLiveClass, endLiveClass, changeSlide, triggerQuiz } = useLiveClass(classId, true);
    const audio = useArenaAudio(); // 🔥 INITIALIZE AUDIO ENGINE
    
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPilot, setIsAutoPilot] = useState(false);
    const [isFinished, setIsFinished] = useState(false); 
    
    // 🔥 NEW OS FEATURE: Quick-Join QR State
    const [showQR, setShowQR] = useState(false);
    const joinUrl = `${window.location.origin}/join/${classId}`;

    // 🔥 PRE-GAME COUNTDOWN ENGINE
    const [preGameCountdown, setPreGameCountdown] = useState<number | null>(null);

    // 🔥 UPGRADED BOOT SEQUENCE STATES
    const [minBootTimePassed, setMinBootTimePassed] = useState(false);
    const [isFetchingCards, setIsFetchingCards] = useState(true);
    const [fetchedCards, setFetchedCards] = useState<any[]>([]);
    
    const scoresRef = useRef<{ [email: string]: number }>({});
    const [gameSettings, setGameSettings] = useState({ qTime: 15, rTime: 6 });
    const [timeLeft, setTimeLeft] = useState(gameSettings.qTime);
    
    const timerRef = useRef<any>(null);
    const safeDeckId = deck?.id || deck?.key || 'custom_vocab_run';

    const liveStateRef = useRef(liveState);
    const currentIndexRef = useRef(currentIndex);

    useEffect(() => { liveStateRef.current = liveState; }, [liveState]);
    useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);

    // Global QR Hotkey
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement).tagName;
            if (['INPUT', 'TEXTAREA'].indexOf(tag) !== -1) return;
            
            if (e.key.toLowerCase() === 'q') {
                e.preventDefault();
                setShowQR(prev => !prev);
            } else if (e.key === 'Escape') {
                setShowQR(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // 1. Minimum Boot Timer (Juice)
    useEffect(() => {
        const timer = setTimeout(() => setMinBootTimePassed(true), 2000);
        return () => clearTimeout(timer);
    }, []);

    // 2. The Critical Fetch Engine
    useEffect(() => {
        const loadCards = async () => {
            if (!deck) return;
            
            if (deck.id === 'custom' || deck.key === 'custom' || (deck.cards && deck.cards.length > 0 && !deck.stats)) {
                setFetchedCards(deck.cards || []);
                setIsFetchingCards(false);
                return;
            }

            try {
                const deckIdToFetch = deck.id || deck.key;
                const cardsRef = collection(db, 'artifacts', appId, 'decks', deckIdToFetch, 'cards');
                const snap = await getDocs(cardsRef);
                setFetchedCards(snap.docs.map(d => d.data()));
            } catch (err) {
                console.error("Projector failed to decrypt targets:", err);
            } finally {
                setIsFetchingCards(false);
            }
        };

        loadCards();
    }, [deck]);

    const isBooting = !minBootTimePassed || isFetchingCards;

    // 3. Map the fetched cards into the quiz logic
    const quizQuestions = useMemo(() => {
        if (fetchedCards.length === 0) return [];
        const shuffledDeck = [...fetchedCards].sort(() => 0.5 - Math.random());
        
        return shuffledDeck.map((card) => {
            const distractors = fetchedCards
                .filter((c: any) => (c.id || c.front) !== (card.id || card.front))
                .sort(() => 0.5 - Math.random()).slice(0, 3);
                
            const options = [card, ...distractors]
                .map((c: any) => ({ id: c.id || c.front, text: c.back }))
                .sort(() => 0.5 - Math.random());
                
            return { question: card.front, ipa: card.ipa, options: options, correctId: card.id || card.front };
        });
    }, [fetchedCards]);

    useEffect(() => {
        if (quizQuestions.length > 0 && classId) startLiveClass(safeDeckId, 'vocab', quizQuestions[0]);
        return () => { endLiveClass(); clearInterval(timerRef.current); };
    }, [classId, safeDeckId, quizQuestions]); 

    // Auto-skip logic
    useEffect(() => {
        if (liveState?.quizState === 'active' && isAutoPilot && preGameCountdown === null) {
            const currentAnswers = Object.keys(liveState?.answers || {}).length;
            const joinedStudentsCount = Object.keys(liveState?.joined || {}).length;
            if (joinedStudentsCount > 0 && currentAnswers >= joinedStudentsCount) {
                setTimeLeft(0); 
            }
        }
    }, [liveState?.answers, liveState?.joined, isAutoPilot, liveState?.quizState, preGameCountdown]);

    // 🔥 AUDIO: Timer Ticker
    useEffect(() => {
        if (!isAutoPilot || isFinished || isBooting || timeLeft <= 0 || preGameCountdown !== null) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                const nextTime = prev - 1;
                if (nextTime > 0) audio.playTick(nextTime <= 5); // Urgent tick under 5s
                return nextTime;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [isAutoPilot, isFinished, isBooting, timeLeft, preGameCountdown, audio]);

    // 🔥 AUDIO: Pre-game Countdown Ticker
    useEffect(() => {
        if (preGameCountdown === null) return;
        if (preGameCountdown > 0) {
            audio.playCountdown(); // BWWAAAAH
            const timer = setTimeout(() => setPreGameCountdown(preGameCountdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            // Countdown finished, fire the actual start logic
            executeStartRun();
            setPreGameCountdown(null);
        }
    }, [preGameCountdown, audio]);

    // Phase Switcher
    useEffect(() => {
        if (timeLeft === 0 && isAutoPilot && !isFinished && preGameCountdown === null) {
            if (liveState?.quizState === 'active') {
                handleReveal();
                setTimeLeft(gameSettings.rTime);
            } else if (liveState?.quizState === 'revealed') {
                handleNext();
            }
        }
    }, [timeLeft, isAutoPilot, isFinished, preGameCountdown]); 

    const handleReveal = async () => {
        audio.playReveal(); // 🔥 AUDIO: Triumphant Chord
        
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
            audio.playStart(); // 🔥 AUDIO: Next Question Chime
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
            audio.playReveal(); // 🔥 AUDIO: Final Victory Chord
            setIsFinished(true);
            updateDoc(doc(db, 'artifacts', appId, 'live_sessions', classId), { quizState: 'finished', finalScores: scoresRef.current });
        }
    };

    // Trigger the countdown, not the actual start
    const startRun = (auto: boolean) => {
        audio.initCtx(); // 🔥 Wakes up the browser's AudioContext
        setIsAutoPilot(auto);
        setPreGameCountdown(3); 
    };

    // The actual database execution once countdown hits 0
    const executeStartRun = async () => {
        audio.playStart(); // 🔥 AUDIO: Game Start Chime
        setTimeLeft(gameSettings.qTime);
        setCurrentIndex(0);
        const qPayload = { ...quizQuestions[0], startTime: Date.now(), timeLimit: gameSettings.qTime * 1000 };
        
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

    const liveLeaderboard = useMemo(() => {
        const scores = liveState?.finalScores || scoresRef.current || {};
        const roundPts = liveState?.roundPoints || {};
        const joinedEmails = Object.keys(liveState?.joined || {});
        
        return joinedEmails.map(email => {
            const s = activeClass?.students?.find((st: any) => st.email.replace(/\./g, ',') === email || st.email === email);
            const joinedData = liveState?.joined?.[email] || {};
            return {
                id: email,
                name: joinedData.name || s?.name || email.split('@')[0],
                equipped: joinedData.equipped,
                score: scores[email] || 0,
                roundPoints: roundPts[email] || 0,
                initial: (s?.name?.[0] || email[0]).toUpperCase()
            };
        }).sort((a, b) => b.score - a.score);
    }, [liveState?.finalScores, liveState?.roundPoints, liveState?.joined, activeClass?.students]);

    // 🔥 HELPER: Renders the QR Modal across any active screen
    const renderQROverlay = () => {
        if (!showQR) return null;
        return (
            <div className="absolute inset-0 z-[9999] bg-slate-900/90 backdrop-blur-2xl flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300 pointer-events-auto text-sans">
                <button onClick={() => setShowQR(false)} className="absolute top-12 right-12 p-6 bg-white/10 hover:bg-rose-500 rounded-full text-white transition-all hover:scale-110 active:scale-95"><X size={40} strokeWidth={3} /></button>
                <h2 className="text-[6vh] font-black text-white uppercase tracking-widest mb-4">Join Live Lobby</h2>
                <p className="text-[3vh] text-indigo-300 font-bold tracking-widest uppercase mb-16">Scan to enter the arena</p>
                <div className="p-10 bg-white rounded-[3rem] shadow-[0_0_100px_rgba(99,102,241,0.4)] animate-in slide-in-from-bottom-8">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(joinUrl)}&margin=10`} alt="Join QR" className="w-[40vh] h-[40vh] object-contain" />
                </div>
                <div className="mt-16 text-center">
                    <p className="text-[2vh] font-bold text-slate-400 uppercase tracking-[0.4em] mb-4">Or enter room code</p>
                    <div className="text-[8vh] font-black text-indigo-400 tracking-[0.2em] leading-none bg-indigo-500/10 py-6 px-12 rounded-[2rem] border-2 border-indigo-500/20">{String(classId || '').substring(0,6).toUpperCase()}</div>
                </div>
            </div>
        );
    };

    // ========================================================================
    //  RENDER: BOOT SEQUENCE
    // ========================================================================
    if (isBooting) {
        return (
            <div className="h-full bg-black flex flex-col items-center justify-center font-mono text-indigo-500 overflow-hidden relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black" />
                <div className="space-y-4 animate-pulse text-center relative z-10">
                    <p className="text-xs tracking-[0.5em] uppercase opacity-50">Initializing Arena OS...</p>
                    <h2 className="text-5xl font-black tracking-tighter text-white uppercase italic">Vocabulary Protocol</h2>
                    <div className="w-64 h-1.5 bg-slate-900 mx-auto rounded-full mt-8 overflow-hidden">
                        <div className="h-full bg-indigo-500 animate-slide-infinite w-1/2 shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
                    </div>
                </div>
            </div>
        );
    }

    // ========================================================================
    //  RENDER: PRE-GAME COUNTDOWN TENSION DROP
    // ========================================================================
    if (preGameCountdown !== null) {
        return (
            <div className="h-full bg-black text-white flex flex-col items-center justify-center relative overflow-hidden font-sans">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-rose-900/40 via-black to-black pointer-events-none animate-pulse" />
                <h2 className="text-4xl font-black uppercase tracking-widest text-rose-500 mb-12">Prepare for Protocol</h2>
                <div key={preGameCountdown} className="text-[15rem] font-black italic leading-none animate-in zoom-in fade-in duration-300 drop-shadow-[0_0_100px_rgba(244,63,94,0.8)] text-white">
                    {preGameCountdown}
                </div>
            </div>
        );
    }

    // ========================================================================
    //  RENDER: PODIUM (FINISHED)
    // ========================================================================
    if (isFinished) {
        const sortedScores = Object.entries(scoresRef.current)
            .map(([email, score]) => {
                const scholar = activeClass?.students?.find((s:any) => s.email.replace(/\./g, ',') === email || s.email === email);
                const joinedData = liveState?.joined?.[email] || {};
                return { 
                    email, 
                    score, 
                    name: joinedData.name || scholar?.name || email.split('@')[0],
                    equipped: joinedData.equipped 
                };
            })
            .sort((a, b) => (b.score as number) - (a.score as number));

        return (
            <div className="h-full bg-black text-white flex flex-col items-center justify-center relative overflow-hidden p-8 font-sans">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-black to-black pointer-events-none" />
                
                <Trophy size={120} className="text-yellow-400 mx-auto mb-8 animate-bounce-slow drop-shadow-[0_0_80px_rgba(250,204,21,0.6)]" strokeWidth={1.5} />
                <h1 className="text-7xl md:text-8xl font-black uppercase tracking-tighter italic mb-20 z-10 drop-shadow-2xl">Protocol Over</h1>
                
                <div className="flex justify-center items-end gap-4 md:gap-8 mb-20 h-72 border-b-4 border-slate-800 w-full max-w-5xl z-10">
                    
                    {/* 2ND PLACE */}
                    {sortedScores[1] && (
                        <div className="flex flex-col items-center w-1/3 animate-in slide-in-from-bottom-8 duration-700 delay-100">
                            <HoloAvatar student={sortedScores[1]} size="xl" className="mb-4" />
                            <div className="text-2xl font-black mb-4 text-slate-300 truncate w-full text-center px-2">{sortedScores[1].name}</div>
                            <div className="w-full h-32 bg-slate-800/80 backdrop-blur-md rounded-t-[2.5rem] pt-8 text-center border-t-4 border-slate-400 shadow-[0_-10px_30px_rgba(148,163,184,0.2)]">
                                <span className="text-4xl font-black tabular-nums">{sortedScores[1].score}</span>
                            </div>
                        </div>
                    )}
                    
                    {/* 1ST PLACE (HERO) */}
                    {sortedScores[0] && (
                        <div className="flex flex-col items-center w-1/3 animate-in slide-in-from-bottom-12 duration-700 delay-300 relative z-20">
                            <Crown className="text-yellow-400 mb-4 scale-150 animate-bounce" fill="currentColor" />
                            <HoloAvatar student={sortedScores[0]} size="hero" className="mb-6 shadow-[0_0_50px_rgba(250,204,21,0.4)]" />
                            <div className="text-4xl font-black mb-4 text-yellow-400 drop-shadow-md truncate w-full text-center px-2">{sortedScores[0].name}</div>
                            <div className="w-full h-48 bg-slate-900/90 backdrop-blur-xl rounded-t-[3rem] pt-12 text-center border-t-4 border-yellow-400 shadow-[0_-20px_50px_rgba(250,204,21,0.25)]">
                                <span className="text-6xl font-black text-yellow-400 tabular-nums">{sortedScores[0].score}</span>
                            </div>
                        </div>
                    )}
                    
                    {/* 3RD PLACE */}
                    {sortedScores[2] && (
                        <div className="flex flex-col items-center w-1/3 animate-in slide-in-from-bottom-4 duration-700">
                            <HoloAvatar student={sortedScores[2]} size="xl" className="mb-4" />
                            <div className="text-2xl font-black mb-4 text-amber-600 truncate w-full text-center px-2">{sortedScores[2].name}</div>
                            <div className="w-full h-24 bg-slate-900/80 backdrop-blur-md rounded-t-[2.5rem] pt-6 text-center border-t-4 border-amber-700 shadow-[0_-10px_30px_rgba(180,83,9,0.2)]">
                                <span className="text-3xl font-black tabular-nums">{sortedScores[2].score}</span>
                            </div>
                        </div>
                    )}
                </div>
                <button onClick={onExit} className="bg-white text-black px-12 py-5 rounded-full font-black text-xl hover:scale-105 active:scale-95 transition-all z-20 shadow-2xl uppercase tracking-widest">Close Session</button>
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
                {renderQROverlay()}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/30 via-black to-black pointer-events-none z-0" />
                
                <header className="flex items-center justify-between z-20 p-10 shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.5)] animate-pulse"><Zap size={32} fill="white" /></div>
                        <div>
                            <h3 className="font-black text-4xl uppercase tracking-tighter drop-shadow-md">{deck.title || 'Magister Deck'}</h3>
                            <p className="text-sm text-indigo-400 font-black uppercase tracking-[0.4em] flex items-center gap-2 mt-1"><Shield size={14} /> {activeClass?.name || 'Fleet'} Protocol</p>
                        </div>
                    </div>
                    
                    {/* 🔥 THE QR BUTTON */}
                    <button 
                        onClick={() => setShowQR(true)} 
                        className="flex items-center gap-3 px-8 py-4 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-white rounded-[2rem] transition-all font-black text-lg uppercase tracking-widest border-2 border-indigo-500/30 active:scale-95 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
                    >
                        <QrCode size={24} /> QR Code (Q)
                    </button>
                </header>

                <main className="flex-1 grid grid-cols-12 gap-8 px-10 pb-10 z-10 overflow-hidden">
                    <div className="col-span-8 bg-slate-900/40 border-2 border-slate-800/80 rounded-[3.5rem] flex flex-col backdrop-blur-xl relative overflow-hidden shadow-2xl">
                        <div className="p-10 flex items-center justify-between border-b border-slate-800/50 shrink-0 bg-slate-900/50">
                            <h1 className="text-5xl font-black uppercase tracking-tighter italic">Arena Lobby</h1>
                            <div className="bg-emerald-500/10 border-2 border-emerald-500/30 px-8 py-4 rounded-[2rem] text-center shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                                <span className="block text-5xl font-black text-emerald-400 leading-none">{joinedCount}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/80 mt-1 block">Scholars Syncing</span>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-8">
                            {activeClass?.students?.map((s: any, i: number) => {
                                const safeEmail = s.email.replace(/\./g, ',');
                                const isConnected = !!joinedStudents[safeEmail];
                                const studentData = joinedStudents[safeEmail] || s; 
                                
                                return (
                                    <div key={i} className={`flex flex-col items-center gap-3 transition-all duration-700 ${isConnected ? 'opacity-100 scale-110' : 'opacity-20 grayscale'}`}>
                                        <HoloAvatar 
                                            student={studentData} 
                                            size="xl" 
                                            className={isConnected ? "shadow-[0_0_40px_rgba(79,70,229,0.6)] ring-4 ring-indigo-500/50" : "border-2 border-slate-700"} 
                                        />
                                        <span className="text-[11px] font-black uppercase truncate w-24 text-center text-slate-300 tracking-wider">{s.name || s.email.split('@')[0]}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="col-span-4 flex flex-col">
                        <div className="flex-1 bg-slate-900/60 border-2 border-slate-800 rounded-[3.5rem] p-10 flex flex-col items-center justify-center text-center shadow-2xl relative z-30 backdrop-blur-xl">
                            <Target size={80} className="text-indigo-500/40 mb-8" />
                            <h2 className="text-2xl font-black uppercase tracking-[0.2em] mb-12 text-slate-400">Execution Mode</h2>
                            
                            <div className="w-full space-y-6">
                                <button 
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); startRun(true); }}
                                    className="w-full py-8 bg-white text-black rounded-[2.5rem] font-black text-3xl uppercase tracking-tighter hover:bg-slate-200 active:scale-95 transition-all shadow-[0_0_50px_rgba(255,255,255,0.2)] cursor-pointer relative z-50 flex items-center justify-center gap-4 group"
                                >
                                    <Zap size={32} fill="black" className="group-hover:scale-110 transition-transform" /> Auto-Pilot
                                </button>
                                <button 
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); startRun(false); }}
                                    className="w-full py-6 bg-slate-800 text-white rounded-[2rem] font-black text-xl uppercase tracking-widest hover:bg-slate-700 hover:border-slate-600 active:scale-95 transition-all border-2 border-slate-700 cursor-pointer relative z-50 flex items-center justify-center gap-3"
                                >
                                    <Hand size={24} /> Manual Mode
                                </button>
                            </div>
                        </div>
                    </div>
                </main>

                <button onClick={onExit} className="absolute top-10 right-10 text-slate-700 hover:text-rose-500 hover:rotate-90 transition-all z-50"><X size={48} /></button>
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

    // 🔥 DYNAMIC TIMER COLOR ENGINE
    const timePct = (timeLeft / (liveState?.quizState === 'revealed' ? gameSettings.rTime : gameSettings.qTime)) * 100;
    let timerColor = 'bg-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.8)]';
    let ambientGlow = 'from-indigo-900/20';
    if (timePct <= 50) {
        timerColor = 'bg-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.8)]';
        ambientGlow = 'from-amber-900/20';
    }
    if (timePct <= 20) {
        timerColor = 'bg-rose-600 shadow-[0_0_40px_rgba(225,29,72,0.9)] animate-pulse';
        ambientGlow = 'from-rose-900/30';
    }

    return (
        <div className="h-full bg-black text-white font-sans flex flex-col overflow-hidden relative">
            {renderQROverlay()}
            <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] ${ambientGlow} via-black to-black transition-colors duration-1000 pointer-events-none`} />
            
            <div className="absolute top-0 left-0 w-full h-2 md:h-3 bg-slate-900 z-50 border-b border-white/5">
                <div className={`h-full transition-all duration-1000 ease-linear ${timerColor}`}
                    style={{ width: `${timePct}%` }} />
            </div>

            <main className="flex-1 grid grid-cols-12 gap-8 p-10 pt-16 relative z-10 overflow-hidden">
                
                {/* 1. LEFT RAIL: Fleet Manifest */}
                <div className="col-span-3 bg-slate-900/40 border-2 border-slate-800/80 rounded-[3rem] p-8 flex flex-col backdrop-blur-xl shadow-2xl">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] mb-8 opacity-50 flex items-center gap-2"><Activity size={16}/> Fleet Manifest</h2>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                        {activeClass?.students?.map((s: any, i: number) => {
                            const safeEmail = s.email.replace(/\./g, ',');
                            if (!joinedStudents[safeEmail]) return null;
                            const hasAnswered = !!answers[safeEmail];
                            const studentData = joinedStudents[safeEmail]; 

                            return (
                                <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 ${hasAnswered ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[inset_0_0_30px_rgba(16,185,129,0.15)]' : 'bg-slate-800/40 border-slate-800/50'}`}>
                                    <div className={`transition-all duration-300 ${hasAnswered ? 'scale-110 drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]' : ''}`}>
                                        <HoloAvatar student={studentData} size="md" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-black uppercase tracking-wider truncate transition-colors duration-300 ${hasAnswered ? 'text-emerald-400' : 'text-slate-400'}`}>
                                            {s.name || s.email.split('@')[0]}
                                        </p>
                                        {hasAnswered && <p className="text-[9px] font-bold text-emerald-500/70 uppercase tracking-widest mt-1">Locked In</p>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 2. CENTER STAGE: The Target */}
                <div className="col-span-6 flex flex-col items-center justify-center text-center px-12 relative">
                    <span className="text-xs font-black text-indigo-400 uppercase tracking-[0.5em] bg-indigo-500/10 px-6 py-3 rounded-full border border-indigo-500/30 mb-12 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                        Target {currentIndex + 1} / {quizQuestions.length}
                    </span>
                    
                    <h2 className="text-7xl md:text-8xl lg:text-[7rem] leading-none font-black tracking-tighter uppercase italic drop-shadow-[0_0_50px_rgba(255,255,255,0.15)] mb-6 text-white">
                        {currentQ?.question}
                    </h2>
                    
                    {currentQ?.ipa && <p className="text-3xl font-mono text-indigo-400 opacity-80 tracking-[0.2em]">{currentQ.ipa}</p>}

                    {liveState?.quizState === 'active' && (
                        <div className="mt-20 w-full max-w-xl">
                            <div className="h-6 w-full bg-slate-900 rounded-full overflow-hidden border-2 border-slate-800 shadow-inner">
                                <div className="h-full bg-indigo-500 transition-all duration-500 shadow-[0_0_20px_rgba(99,102,241,0.8)]" style={{ width: `${progressPct}%` }} />
                            </div>
                            <div className="flex justify-between mt-6">
                                <span className="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">{answerCount} / {joinedCount} Locked In</span>
                                <span className="text-sm font-black text-indigo-400 uppercase tracking-[0.2em]">{Math.round(progressPct)}% Sync</span>
                            </div>
                            {!isAutoPilot && (
                                <button onClick={handleReveal} className="mt-16 bg-white text-black px-16 py-6 rounded-full font-black text-2xl uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                                    Reveal Protocol
                                </button>
                            )}
                        </div>
                    )}

                    {liveState?.quizState === 'revealed' && (
                        <div className="mt-16 animate-in zoom-in-95 duration-500 w-full flex flex-col items-center">
                            <div className="bg-emerald-500 text-white px-12 py-10 rounded-[3rem] w-full max-w-3xl text-5xl md:text-6xl font-black border-4 border-emerald-300 shadow-[0_0_80px_rgba(16,185,129,0.5)] tracking-tight leading-tight">
                                {currentQ?.options.find((o:any) => o.id === currentQ.correctId)?.text}
                            </div>
                            {!isAutoPilot && (
                                <button onClick={handleNext} className="mt-16 flex items-center gap-4 text-slate-400 hover:text-white font-black text-2xl uppercase tracking-[0.2em] transition-all mx-auto bg-slate-900 px-10 py-5 rounded-full border border-slate-800 hover:border-slate-600">
                                    {currentIndex < quizQuestions.length - 1 ? 'Next Target' : 'Final Rankings'} <ArrowRight size={28} />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* 3. RIGHT RAIL: Live Standings */}
                <div className="col-span-3 bg-slate-900/40 border-2 border-slate-800/80 rounded-[3rem] p-8 flex flex-col backdrop-blur-xl relative overflow-hidden shadow-2xl">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] mb-6 opacity-50 flex items-center gap-3">
                        <Trophy size={18} className="text-yellow-500" /> Live Standings
                    </h2>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                        {liveLeaderboard.length > 0 ? liveLeaderboard.map((player: any, i: number) => (
                            <div 
                                key={player.id} 
                                className={`flex items-center justify-between p-4 bg-slate-800/40 border-2 rounded-[1.5rem] relative overflow-hidden group transition-all duration-500 ${
                                    i === 0 ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-slate-700/50'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 shadow-md ${
                                        i === 0 ? 'bg-yellow-500 text-yellow-950 shadow-[0_0_20px_rgba(234,179,8,0.5)] border-2 border-yellow-200' : 
                                        i === 1 ? 'bg-slate-200 text-slate-800 border-2 border-white' : 
                                        i === 2 ? 'bg-amber-700 text-amber-100 border-2 border-amber-500' : 
                                        'bg-slate-800 text-slate-400 border border-slate-600'
                                    }`}>
                                        {i + 1}
                                    </div>
                                    <HoloAvatar student={player} size="md" />
                                    <span className={`text-xs font-black uppercase truncate max-w-[100px] tracking-wider ${i === 0 ? 'text-yellow-500' : 'text-slate-200'}`}>
                                        {player.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-right">
                                    {player.roundPoints > 0 && liveState?.quizState === 'revealed' && (
                                        <span className="text-[10px] font-black text-emerald-400 animate-in slide-in-from-bottom-2 fade-in duration-500 tracking-widest bg-emerald-500/10 px-2 py-1 rounded-md">
                                            +{player.roundPoints}
                                        </span>
                                    )}
                                    <span className="text-sm font-black text-indigo-400 tabular-nums tracking-wider">{player.score}</span>
                                </div>
                            </div>
                        )) : (
                            <div className="h-full flex flex-col items-center justify-center opacity-30">
                                <Activity size={32} className="mb-4 text-slate-400" />
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Awaiting Scores</p>
                            </div>
                        )}
                    </div>
                    {isAutoPilot && (
                        <div className="mt-8 pt-8 border-t-2 border-slate-800 text-center shrink-0">
                            <div className={`text-7xl font-black tabular-nums transition-all tracking-tighter ${timePct <= 20 && liveState?.quizState !== 'revealed' ? 'text-rose-500 animate-pulse scale-110 drop-shadow-[0_0_20px_rgba(225,29,72,0.8)]' : 'text-slate-700'}`}>
                                {timeLeft}s
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] block mt-2">
                                {liveState?.quizState === 'revealed' ? 'Next Round' : 'Remaining'}
                            </span>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
