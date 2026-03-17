// src/components/LiveConnectFourProjector.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLiveClass } from '../hooks/useLiveClass';
import { Users, Timer, Zap, X, Trophy, Swords, ArrowDownCircle, Shield } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, appId } from '../config/firebase';

const COLS = 7;
const ROWS = 6;

export default function LiveConnectFourProjector({ deck, classId, activeClass, onExit }: any) {
    const { liveState, startLiveClass, endLiveClass } = useLiveClass(classId, true);
    
    // Core Game State
    const [gameState, setGameState] = useState<'lobby' | 'active' | 'finished'>('lobby');
    const [teams, setTeams] = useState<{ [email: string]: 1 | 2 }>({});
    const [grid, setGrid] = useState<number[][]>(Array(COLS).fill([]));
    const [currentTurn, setCurrentTurn] = useState<1 | 2>(1); // 1 = Red, 2 = Blue
    const [winningTeam, setWinningTeam] = useState<1 | 2 | null>(null);

    const safeDeckId = deck?.id || deck?.key || 'c4_vocab_run';

    // 🔥 HELPER: DYNAMIC QUIZ GENERATOR
    const generateQuestion = () => {
        if (!deck?.cards || deck.cards.length === 0) return null;
        const shuffled = [...deck.cards].sort(() => 0.5 - Math.random());
        const correct = shuffled[0];
        const distractors = shuffled.slice(1, 4);
        const allOptions = [correct, ...distractors]
            .map((c: any) => ({ id: c.id || c.front, text: c.back }))
            .sort(() => 0.5 - Math.random());
        
        return { 
            question: correct.front, 
            options: allOptions, 
            correctId: correct.id || correct.front 
        };
    };

    // INIT LOBBY
    useEffect(() => {
        if (classId) {
            startLiveClass(safeDeckId, 'connect_four' as any, null);
        }
        return () => { endLiveClass(); };
    }, [classId, safeDeckId]);

    // 🔥 THE GAME ENGINE: Listens for student 'lastMove' signals
    useEffect(() => {
        if (gameState !== 'active' || !liveState?.lastMove) return;
        
        const move = liveState.lastMove;
        
        // Prevent processing stale moves or moves for the wrong team
        if (move.team !== currentTurn) return;
        // Prevent dropping into a full column
        if (grid[move.col].length >= ROWS) return;

        // 1. Update Local Grid
        const newGrid = [...grid];
        const updatedColumn = [...newGrid[move.col], move.team];
        newGrid[move.col] = updatedColumn;
        setGrid(newGrid);

        // 2. Check Win Condition
        const currentRow = updatedColumn.length - 1;
        if (checkWin(newGrid, move.col, currentRow, move.team)) {
            setWinningTeam(move.team);
            setGameState('finished');
            
            const sessionRef = doc(db, 'artifacts', appId, 'live_sessions', classId);
            updateDoc(sessionRef, { 
                quizState: 'finished', 
                winningTeam: move.team,
                lastMove: null // Clear the trigger
            });
        } else {
            // 3. Setup Next Turn
            const nextTeam = currentTurn === 1 ? 2 : 1;
            setCurrentTurn(nextTeam);
            const nextQ = generateQuestion();
            
            const sessionRef = doc(db, 'artifacts', appId, 'live_sessions', classId);
            updateDoc(sessionRef, { 
                currentTurn: nextTeam,
                currentQuestion: nextQ,
                answers: {}, // Clear answers for the new round
                lastMove: null // Clear the trigger so it doesn't fire again
            });
        }
    }, [liveState?.lastMove, currentTurn, gameState]);

    // 4-In-A-Row Logic
    const checkWin = (board: number[][], dropCol: number, dropRow: number, player: number) => {
        const countConsecutive = (dx: number, dy: number) => {
            let count = 0;
            let c = dropCol + dx;
            let r = dropRow + dy;
            while (c >= 0 && c < COLS && r >= 0 && r < ROWS && board[c][r] === player) {
                count++; c += dx; r += dy;
            }
            return count;
        };

        const directions = [ [[1, 0], [-1, 0]], [[0, 1], [0, -1]], [[1, 1], [-1, -1]], [[1, -1], [-1, 1]] ];
        for (let axis of directions) {
            if (1 + countConsecutive(axis[0][0], axis[0][1]) + countConsecutive(axis[1][0], axis[1][1]) >= 4) return true;
        }
        return false;
    };

    // START MATCH: Shuffle teams and broadcast first question
    const startMatch = async () => {
        const joinedEmails = Object.keys(liveState?.joined || {});
        if (joinedEmails.length === 0) return alert("Waiting for students to join!");

        const shuffled = [...joinedEmails].sort(() => 0.5 - Math.random());
        const newTeams: any = {};
        shuffled.forEach((email, i) => {
            newTeams[email] = i % 2 === 0 ? 1 : 2; 
        });
        setTeams(newTeams);

        const firstQ = generateQuestion();
        
        const sessionRef = doc(db, 'artifacts', appId, 'live_sessions', classId);
        await updateDoc(sessionRef, {
            quizState: 'active',
            currentTurn: 1,
            teams: newTeams,
            currentQuestion: firstQ,
            answers: {},
            lastMove: null,
            grid: Array(COLS).fill([]) // Ensure the grid is synced in DB too
        });

        setGameState('active');
    };

    const joinedCount = Object.keys(liveState?.joined || {}).length;

    // LOBBY VIEW
    if (gameState === 'lobby') {
        return (
            <div className="h-full bg-slate-950 text-white flex flex-col relative overflow-hidden font-sans">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/40 via-slate-950 to-black pointer-events-none" />
                <div className="flex items-center justify-between z-20 p-8 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black shadow-lg shadow-white/20"><Swords size={24} className="text-slate-900" /></div>
                        <div>
                            <h3 className="font-black text-xl uppercase tracking-tighter text-white">Connect Four Arena</h3>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{activeClass?.name}</p>
                        </div>
                    </div>
                    <button onClick={onExit} className="text-slate-600 hover:text-rose-500 p-2"><X size={32} /></button>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center min-h-0 px-8 pb-12 z-10 w-full max-w-4xl mx-auto">
                    <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter mb-4 italic text-transparent bg-clip-text bg-gradient-to-br from-rose-500 to-indigo-500">Squad Battle</h1>
                    <div className="bg-slate-900/50 border-4 border-slate-800 rounded-[3rem] p-12 w-full shadow-2xl backdrop-blur-md mt-8">
                        <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-6">
                            <span className="text-xl font-black uppercase tracking-widest text-slate-500">Connected Scholars</span>
                            <span className="bg-white text-slate-900 px-6 py-2 rounded-full font-black text-2xl">{joinedCount}</span>
                        </div>
                        <div className="grid grid-cols-8 gap-6">
                            {activeClass?.students?.map((s: any, i: number) => {
                                const safeEmail = s.email.replace(/\./g, ',');
                                const isConnected = !!liveState?.joined?.[safeEmail];
                                return (
                                    <div key={i} className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-xl font-black transition-all ${isConnected ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] scale-110' : 'bg-slate-800 border-slate-700 text-slate-500 opacity-30'}`}>
                                        {(s.name?.[0] || s.email[0]).toUpperCase()}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <button onClick={startMatch} disabled={joinedCount === 0} className="mt-12 bg-white text-black px-16 py-6 rounded-full font-black text-3xl uppercase tracking-widest hover:scale-105 active:scale-95 shadow-[0_0_60px_rgba(255,255,255,0.2)]">Launch Battle</button>
                </div>
            </div>
        );
    }

    // ACTIVE GAME VIEW
    if (gameState === 'active') {
        const teamAnswers = Object.entries(liveState?.answers || {}).filter(([email]) => teams[email] === currentTurn);
        const totalOnActiveTeam = Object.values(teams).filter(t => t === currentTurn).length;

        return (
            <div className="h-full flex flex-col bg-slate-950 text-white font-sans relative overflow-hidden">
                <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] opacity-20 pointer-events-none transition-colors duration-1000 ${currentTurn === 1 ? 'from-rose-600 via-slate-950 to-black' : 'from-indigo-600 via-slate-950 to-black'}`} />
                <div className="flex justify-between items-start p-12 relative z-20">
                     <div className={`p-6 rounded-[2.5rem] border-4 transition-all ${currentTurn === 1 ? 'bg-rose-500/10 border-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.3)] scale-105' : 'bg-slate-900 border-slate-800 opacity-50'}`}>
                         <h3 className="font-black text-xl uppercase tracking-widest text-rose-500 mb-2">Team Red</h3>
                         <div className="flex gap-2">{Object.entries(teams).filter(([_, t]) => t === 1).map(([e], i) => <div key={i} className="w-8 h-8 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-xs font-black">{e[0].toUpperCase()}</div>)}</div>
                     </div>
                     <div className={`p-6 rounded-[2.5rem] border-4 transition-all ${currentTurn === 2 ? 'bg-indigo-500/10 border-indigo-500 shadow-[0_0_40px_rgba(99,102,241,0.3)] scale-105' : 'bg-slate-900 border-slate-800 opacity-50'}`}>
                         <h3 className="font-black text-xl uppercase tracking-widest text-indigo-500 mb-2 text-right">Team Blue</h3>
                         <div className="flex gap-2 justify-end">{Object.entries(teams).filter(([_, t]) => t === 2).map(([e], i) => <div key={i} className="w-8 h-8 rounded-full bg-indigo-500/20 border-2 border-indigo-500 flex items-center justify-center text-xs font-black">{e[0].toUpperCase()}</div>)}</div>
                     </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center z-10 px-8 pb-12">
                    <div className="text-center mb-8">
                        <span className={`text-sm font-black uppercase tracking-[0.3em] block mb-2 ${currentTurn === 1 ? 'text-rose-400' : 'text-indigo-400'}`}>{currentTurn === 1 ? 'Red Team' : 'Blue Team'} Decoding...</span>
                        <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic">{liveState?.currentQuestion?.question}</h2>
                    </div>

                    <div className="bg-slate-800 p-6 rounded-[3rem] border-8 border-slate-700 shadow-2xl">
                        <div className="flex gap-4">
                            {grid.map((col, colIdx) => (
                                <div key={colIdx} className="flex flex-col-reverse gap-4">
                                    {Array.from({ length: ROWS }).map((_, rowIdx) => {
                                        const token = col[rowIdx];
                                        let style = 'bg-slate-900 border-4 border-slate-950 shadow-inner';
                                        if (token === 1) style = 'bg-rose-500 border-4 border-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.5)]';
                                        if (token === 2) style = 'bg-indigo-500 border-4 border-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.5)]';
                                        return (
                                            <div key={rowIdx} className="w-16 h-16 md:w-20 md:h-20 rounded-full relative overflow-hidden flex items-center justify-center">
                                                <div className={`w-full h-full rounded-full transition-all duration-500 ${style} ${token ? 'animate-in slide-in-from-top-24 duration-700 ease-bounce' : ''}`} />
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // WIN SCREEN
    return (
        <div className="h-full flex flex-col bg-slate-950 text-white font-sans items-center justify-center relative overflow-hidden">
            <Trophy size={120} className={`mb-8 ${winningTeam === 1 ? 'text-rose-500' : 'text-indigo-500'} animate-bounce-slow`} />
            <h1 className="text-8xl font-black uppercase italic tracking-tighter">{winningTeam === 1 ? 'Red Squad' : 'Blue Squad'} Wins</h1>
            <button onClick={onExit} className="mt-16 bg-white text-black px-16 py-6 rounded-full font-black text-2xl uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">End Session</button>
        </div>
    );
}
