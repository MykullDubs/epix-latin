// src/components/ConnectThreeVocab.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { User, Trophy, Bot, RefreshCcw, ArrowDown } from 'lucide-react';

// ============================================================================
//  CONNECT THREE: VOCABULARY BATTLE
// ============================================================================
export default function ConnectThreeVocab({ vocabList, mode = 'pvp', targetScore = 3 }: any) {
    // Fallback vocabulary
    const defaultVocab = [
        { term: "Serendipity", definition: "The occurrence of events by chance in a happy or beneficial way." },
        { term: "Ephemeral", definition: "Lasting for a very short time." },
        { term: "Cacophony", definition: "A harsh, discordant mixture of sounds." },
        { term: "Enigma", definition: "A person or thing that is mysterious, puzzling, or difficult to understand." }
    ];

    const activeVocab = vocabList?.length > 3 ? vocabList : defaultVocab;
    const COLS = 4;
    const ROWS = 5;

    // --- GAME STATE ---
    const [grid, setGrid] = useState<number[][]>(Array(COLS).fill([]));
    const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
    const [scores, setScores] = useState({ 1: 0, 2: 0 });
    const [gameOver, setGameOver] = useState(false);

    // --- VOCABULARY STATE ---
    const [currentPrompt, setCurrentPrompt] = useState<any>(null);
    const [options, setOptions] = useState<string[]>([]);
    const [earnedDrop, setEarnedDrop] = useState(false);

    // --- GENERATE QUESTION ---
    const generateQuestion = useCallback(() => {
        const shuffled = [...activeVocab].sort(() => 0.5 - Math.random());
        const correct = shuffled[0];
        const distractors = shuffled.slice(1, 4).map(v => v.term);
        const allOptions = [correct.term, ...distractors].sort(() => 0.5 - Math.random());
        
        setCurrentPrompt(correct);
        setOptions(allOptions);
        setEarnedDrop(false);
    }, [activeVocab]);

    useEffect(() => {
        generateQuestion();
    }, [generateQuestion]);

    // --- BOT LOGIC (Player 2 AI) ---
    useEffect(() => {
        // If it's the CPU's turn, and they haven't earned a drop yet
        if (mode === 'pvc' && currentPlayer === 2 && !gameOver && !earnedDrop) {
            const timer = setTimeout(() => {
                // Bot "answers" correctly
                setEarnedDrop(true);
            }, 1500); // Wait 1.5s to read the question
            return () => clearTimeout(timer);
        }
    }, [currentPlayer, mode, gameOver, earnedDrop]);

    useEffect(() => {
        // If the CPU has earned their drop, pick a column!
        if (mode === 'pvc' && currentPlayer === 2 && earnedDrop && !gameOver) {
            const timer = setTimeout(() => {
                const validCols = [0, 1, 2, 3].filter(c => grid[c].length < ROWS);
                if (validCols.length > 0) {
                    const randomCol = validCols[Math.floor(Math.random() * validCols.length)];
                    handleDrop(randomCol);
                }
            }, 1000); // Wait 1s before dropping
            return () => clearTimeout(timer);
        }
    }, [earnedDrop, currentPlayer, mode, gameOver, grid]);

    // --- SCORING ALGORITHM ---
    const checkScore = (newGrid: number[][], dropCol: number, dropRow: number, player: number) => {
        let newPoints = 0;

        const countConsecutive = (dx: number, dy: number) => {
            let count = 0;
            let c = dropCol + dx;
            let r = dropRow + dy;
            while (c >= 0 && c < COLS && r >= 0 && r < ROWS && newGrid[c][r] === player) {
                count++;
                c += dx;
                r += dy;
            }
            return count;
        };

        const directions = [
            [[1, 0], [-1, 0]],   // Horizontal
            [[0, 1], [0, -1]],   // Vertical
            [[1, 1], [-1, -1]],  // Diagonal /
            [[1, -1], [-1, 1]]   // Diagonal \
        ];

        directions.forEach(axis => {
            const totalInLine = 1 + countConsecutive(axis[0][0], axis[0][1]) + countConsecutive(axis[1][0], axis[1][1]);
            if (totalInLine >= 3) newPoints += 1; 
        });

        if (newPoints > 0) {
            setScores(prev => {
                const updatedScores = { ...prev, [player]: prev[player as keyof typeof prev] + newPoints };
                // --- DYNAMIC WIN CONDITION ---
                if (updatedScores[1] >= targetScore || updatedScores[2] >= targetScore) {
                    setGameOver(true);
                }
                return updatedScores;
            });
        }
    };

    // --- PLAYER ACTIONS ---
    const handleAnswer = (selectedTerm: string) => {
        // Prevent humans from clicking during the Bot's turn
        if (mode === 'pvc' && currentPlayer === 2) return; 

        if (selectedTerm === currentPrompt.term) {
            setEarnedDrop(true);
        } else {
            setCurrentPlayer(prev => prev === 1 ? 2 : 1);
            generateQuestion();
        }
    };

    const handleDrop = (colIndex: number) => {
        // Prevent humans from dropping during the Bot's turn
        if (mode === 'pvc' && currentPlayer === 2 && !earnedDrop) return;
        if (!earnedDrop || gameOver) return;
        if (grid[colIndex].length >= ROWS) return; 

        const newGrid = grid.map(col => [...col]);
        newGrid[colIndex].push(currentPlayer);
        
        const rowIndex = newGrid[colIndex].length - 1;
        checkScore(newGrid, colIndex, rowIndex, currentPlayer);
        
        setGrid(newGrid);

        if (newGrid.every(col => col.length === ROWS)) {
            setGameOver(true);
        } else if (!gameOver) {
            setCurrentPlayer(prev => prev === 1 ? 2 : 1);
            generateQuestion();
        }
    };

    const resetGame = () => {
        setGrid(Array(COLS).fill([]));
        setScores({ 1: 0, 2: 0 });
        setGameOver(false);
        setCurrentPlayer(1);
        generateQuestion();
    };

    const activeColor = currentPlayer === 1 ? 'rose' : 'indigo';
    const isBotTurn = mode === 'pvc' && currentPlayer === 2;

    return (
        <div className="w-full max-w-md mx-auto bg-white rounded-[3rem] border-2 border-slate-100 shadow-xl overflow-hidden animate-in fade-in duration-500">
            
            {/* SCOREBOARD */}
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center relative">
                <div className={`flex flex-col items-center p-3 rounded-2xl w-24 transition-all ${currentPlayer === 1 ? 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)] scale-110 z-10' : 'opacity-50'}`}>
                    <User size={20} className="mb-1" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Player 1</span>
                    <span className="text-2xl font-black">{scores[1]}</span>
                </div>
                
                <div className="flex flex-col items-center">
                    <Trophy size={24} className="text-yellow-400 mb-1" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">First to {targetScore}</span>
                </div>

                <div className={`flex flex-col items-center p-3 rounded-2xl w-24 transition-all ${currentPlayer === 2 ? 'bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)] scale-110 z-10' : 'opacity-50'}`}>
                    {mode === 'pvc' ? <Bot size={20} className="mb-1" /> : <User size={20} className="mb-1" />}
                    <span className="text-[10px] font-black uppercase tracking-widest">{mode === 'pvc' ? 'CPU Bot' : 'Player 2'}</span>
                    <span className="text-2xl font-black">{scores[2]}</span>
                </div>
            </div>

            <div className="p-6">
                {/* ACTION AREA */}
                <div className="mb-8 min-h-[160px] flex flex-col justify-center">
                    {gameOver ? (
                        <div className="text-center animate-in zoom-in">
                            <h2 className="text-3xl font-black text-slate-800 mb-2">Game Over!</h2>
                            <p className="font-bold text-slate-400 uppercase tracking-widest mb-6">
                                {scores[1] >= targetScore ? 'Player 1 Wins!' : scores[2] >= targetScore ? (mode === 'pvc' ? 'CPU Wins!' : 'Player 2 Wins!') : 'It is a tie!'}
                            </p>
                            <button onClick={resetGame} className="mx-auto bg-slate-900 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 active:scale-95 transition-transform">
                                <RefreshCcw size={16}/> Play Again
                            </button>
                        </div>
                    ) : earnedDrop ? (
                        <div className={`text-center p-6 rounded-3xl border-2 border-dashed bg-${activeColor}-50 border-${activeColor}-200 animate-in fade-in`}>
                            <ArrowDown size={32} className={`mx-auto mb-2 text-${activeColor}-500 ${isBotTurn ? 'animate-pulse' : 'animate-bounce'}`} />
                            <h3 className={`text-lg font-black text-${activeColor}-700 uppercase tracking-widest`}>
                                {isBotTurn ? 'CPU is choosing...' : 'Select a column to drop'}
                            </h3>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-2">
                            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl mb-4 text-center shadow-inner relative overflow-hidden">
                                {isBotTurn && <div className="absolute inset-0 bg-indigo-500/10 animate-pulse" />}
                                <span className={`text-[10px] font-black uppercase tracking-widest text-${activeColor}-500 block mb-2 relative z-10`}>
                                    {isBotTurn ? 'CPU is thinking...' : `Player ${currentPlayer}'s Turn`}
                                </span>
                                <h3 className="font-bold text-slate-800 text-lg leading-snug relative z-10">
                                    "{currentPrompt?.definition}"
                                </h3>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {options.map(opt => (
                                    <button 
                                        key={opt} 
                                        onClick={() => handleAnswer(opt)}
                                        disabled={isBotTurn}
                                        className={`p-3 rounded-xl font-bold text-sm transition-all border-2 border-slate-100 ${isBotTurn ? 'opacity-50 cursor-not-allowed' : `hover:border-${activeColor}-300 hover:bg-${activeColor}-50 hover:text-${activeColor}-700 text-slate-600 active:scale-95`}`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* THE GAME BOARD */}
                <div className="bg-slate-100 p-4 rounded-[2rem] shadow-inner relative">
                    <div className="flex justify-between gap-2 h-[280px]">
                        {[0, 1, 2, 3].map(colIndex => (
                            <div 
                                key={colIndex}
                                onClick={() => !isBotTurn && handleDrop(colIndex)}
                                className={`flex-1 flex flex-col-reverse justify-start gap-2 rounded-2xl transition-colors ${earnedDrop && !isBotTurn && grid[colIndex].length < ROWS ? `cursor-pointer hover:bg-${activeColor}-500/10` : ''}`}
                            >
                                {Array.from({ length: ROWS }).map((_, rowIndex) => {
                                    const token = grid[colIndex][rowIndex]; 
                                    let tokenColor = 'bg-white shadow-inner'; 
                                    if (token === 1) tokenColor = 'bg-rose-500 shadow-md shadow-rose-200';
                                    if (token === 2) tokenColor = 'bg-indigo-500 shadow-md shadow-indigo-200';

                                    return (
                                        <div key={rowIndex} className="flex-1 rounded-full relative overflow-hidden flex items-center justify-center p-1">
                                            <div className={`w-full h-full rounded-full transition-all duration-300 ${tokenColor} ${token ? 'animate-in slide-in-from-top-12 duration-500 ease-bounce' : ''}`} />
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
