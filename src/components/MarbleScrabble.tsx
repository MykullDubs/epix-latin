import React, { useState, useEffect } from 'react';
import { Trophy, Clock, CheckCircle2, ShieldAlert, FastForward, ArrowDownToLine, Star, Users, UserPlus, PenTool, User, MessageSquare, Shuffle, Loader2, AlertTriangle } from 'lucide-react';

// ==========================================
// GAME DATA & CONSTANTS
// ==========================================
const BOARD_SIZE = 15;
const LETTER_DISTRIBUTIONS: Record<string, { count: number, value: number }> = {
  A: { count: 9, value: 1 }, B: { count: 2, value: 3 }, C: { count: 2, value: 3 },
  D: { count: 4, value: 2 }, E: { count: 12, value: 1 }, F: { count: 2, value: 4 },
  G: { count: 3, value: 2 }, H: { count: 2, value: 4 }, I: { count: 9, value: 1 },
  J: { count: 1, value: 8 }, K: { count: 1, value: 5 }, L: { count: 4, value: 1 },
  M: { count: 2, value: 3 }, N: { count: 6, value: 1 }, O: { count: 8, value: 1 },
  P: { count: 2, value: 3 }, Q: { count: 1, value: 10 }, R: { count: 6, value: 1 },
  S: { count: 4, value: 1 }, T: { count: 6, value: 1 }, U: { count: 4, value: 1 },
  V: { count: 2, value: 4 }, W: { count: 2, value: 4 }, X: { count: 1, value: 8 },
  Y: { count: 2, value: 4 }, Z: { count: 1, value: 10 }
};

const INDIVIDUAL_COLORS = [
  { color: "bg-indigo-500", textColor: "text-indigo-500" },
  { color: "bg-rose-500", textColor: "text-rose-500" },
  { color: "bg-amber-500", textColor: "text-amber-500" },
  { color: "bg-emerald-500", textColor: "text-emerald-500" },
  { color: "bg-blue-500", textColor: "text-blue-500" },
  { color: "bg-fuchsia-500", textColor: "text-fuchsia-500" },
];

const getSquareType = (r: number, c: number) => {
  if ((r === 0 || r === 7 || r === 14) && (c === 0 || c === 7 || c === 14) && !(r === 7 && c === 7)) return 'TW';
  if (r === 7 && c === 7) return 'CT';
  const dwDiagonals = [1, 2, 3, 4, 10, 11, 12, 13];
  if (r === c && dwDiagonals.includes(r)) return 'DW';
  if (14 - r === c && dwDiagonals.includes(r)) return 'DW';
  const tlPoints = [[1,5], [1,9], [5,1], [5,5], [5,9], [5,13], [9,1], [9,5], [9,9], [9,13], [13,5], [13,9]];
  if (tlPoints.some(([tr, tc]) => tr === r && tc === c)) return 'TL';
  const dlPoints = [[0,3], [0,11], [2,6], [2,8], [3,0], [3,7], [3,14], [6,2], [6,6], [6,8], [6,12], [7,3], [7,11], [8,2], [8,6], [8,8], [8,12], [11,0], [11,7], [11,14], [12,6], [12,8], [14,3], [14,11]];
  if (dlPoints.some(([tr, tc]) => tr === r && tc === c)) return 'DL';
  return null;
};

const createInitialBag = () => {
  let bag: any[] = [];
  let idCounter = 0;
  Object.entries(LETTER_DISTRIBUTIONS).forEach(([letter, data]) => {
    for (let i = 0; i < data.count; i++) {
      bag.push({ id: `tile_${idCounter++}`, letter, value: data.value });
    }
  });
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
};

const MarbleTile = ({ tile, isSelected, isLocked, onClick, className = '' }: any) => {
  if (!tile) return null;
  return (
    <div
      onClick={!isLocked ? onClick : undefined}
      className={`relative flex items-center justify-center rounded-md transition-all duration-200 marble-tile select-none ${
        isSelected ? 'ring-4 ring-amber-400 ring-offset-2 scale-110 z-10 shadow-xl cursor-pointer' 
        : isLocked ? 'shadow-sm brightness-[0.85] cursor-default' 
        : 'hover:scale-105 shadow-md cursor-pointer group'
      } ${className}`}
    >
      <span className="playfair-font font-bold letterpress tracking-tighter text-xl">
        {tile.letter}
      </span>
      <span className="absolute bottom-0.5 right-1 text-[10px] playfair-font font-bold text-slate-700 opacity-80">
        {tile.value}
      </span>
      <div className="absolute inset-0 rounded-md bg-gradient-to-tr from-white/0 via-white/20 to-white/60 pointer-events-none mix-blend-overlay"></div>
    </div>
  );
};

export default function MarbleScrabble({ block, isProjector, liveState, studentId, onUpdateLiveState }: any) {
  const timeLimit = liveState?.timeLimit || block?.timePerTurnSeconds || 60;
  const [selectedTime, setSelectedTime] = useState(60);

  useEffect(() => {
    if (!document.getElementById('marble-styles')) {
      const style = document.createElement('style');
      style.id = 'marble-styles';
      style.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap');
        .playfair-font { font-family: 'Playfair Display', serif; }
        .marble-tile {
          background-color: #fcfbf9;
          background-image: linear-gradient(45deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 30%, rgba(0,0,0,0.02) 50%, rgba(255,255,255,0) 70%, rgba(255,255,255,0.6) 100%), radial-gradient(circle at 80% 20%, rgba(0,0,0,0.02) 0%, transparent 20%), radial-gradient(circle at 20% 80%, rgba(0,0,0,0.03) 0%, transparent 30%);
          box-shadow: inset 1px 1px 2px rgba(255,255,255,0.9), inset -1px -1px 3px rgba(0,0,0,0.15), 2px 3px 5px rgba(0,0,0,0.3);
          border: 1px solid #e2ddce;
        }
        .letterpress { color: #1a202c; text-shadow: -1px -1px 1px rgba(0,0,0,0.4), 1px 1px 1px rgba(255,255,255,0.8); }
        .wood-bg { background-color: #1e293b; background-image: radial-gradient(circle at center, #334155 0%, #0f172a 100%); }
        .board-grid { display: grid; grid-template-columns: repeat(${BOARD_SIZE}, minmax(0, 1fr)); gap: 2px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    if (isProjector && !liveState?.gameStatus) {
      onUpdateLiveState({
        gameStatus: 'lobby_join', 
        players: {}, 
        teams: {}, 
        board: Array(BOARD_SIZE * BOARD_SIZE).fill(null),
        bag: createInitialBag(),
        scores: {},
        teamWords: {}, 
        activeTeamIndex: 0,
        turnEndTime: null,
      });
    }
  }, [isProjector, liveState]);

  const gameStatus = liveState?.gameStatus;
  const players: Record<string, any> = liveState?.players || {};
  const teams: Record<string, any> = liveState?.teams || {};
  const globalBoard = liveState?.board;
  const globalBag = liveState?.bag;
  const scores: Record<string, number> = liveState?.scores || {};
  const teamWords: Record<string, string[]> = liveState?.teamWords || {}; 
  const activeTeamIndex = liveState?.activeTeamIndex || 0;
  const turnEndTime = liveState?.turnEndTime;
  const latestSentence = liveState?.latestSentence;
  
  const teamArray = Object.values(teams).sort((a: any, b: any) => a.order - b.order);
  const activeTeam: any = teamArray[activeTeamIndex] || teamArray[0] || {};
  
  const myTeamEntry: any = Object.values(teams).find((t: any) => t.members.includes(studentId));
  const myTeamId = myTeamEntry?.id;
  const isMyTurn = myTeamId === activeTeam?.id && gameStatus === 'playing';

  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    if (!turnEndTime) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((turnEndTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0 && isProjector && gameStatus === 'playing') {
        passTurn(); 
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [turnEndTime, isProjector, gameStatus]);

  // ==========================================
  // STUDENT INTERACTION STATE
  // ==========================================
  const [localBoard, setLocalBoard] = useState(globalBoard || Array(BOARD_SIZE * BOARD_SIZE).fill(null));
  const [rack, setRack] = useState<any[]>(Array(7).fill(null));
  const [targetSquare, setTargetSquare] = useState<number | null>(null);
  const [lastPlacedIndex, setLastPlacedIndex] = useState<number | null>(null);
  const [playDirection, setPlayDirection] = useState<number | null>(null);
  const [customTeamName, setCustomTeamName] = useState("");
  const [hasDrawnInitialHand, setHasDrawnInitialHand] = useState(false);
  const [selectedRackIndex, setSelectedRackIndex] = useState<number | null>(null);
  
  // 🔥 BONUS & VALIDATION STATE
  const [pendingSentence, setPendingSentence] = useState(false);
  const [sentenceText, setSentenceText] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [invalidWords, setInvalidWords] = useState<string[]>([]);
  const [currentTurnWords, setCurrentTurnWords] = useState<string[]>([]);
  const [currentTurnScore, setCurrentTurnScore] = useState(0);

  useEffect(() => {
    if (globalBoard) {
      setLocalBoard(globalBoard);
      setTargetSquare(null);
      setLastPlacedIndex(null);
      setPlayDirection(null);
      setPendingSentence(false);
      setSentenceText("");
      setSelectedRackIndex(null);
      setInvalidWords([]);
      setCurrentTurnWords([]);
    }
  }, [globalBoard]);

  useEffect(() => {
    if (!isProjector && !isMyTurn) {
        let newRack = [...rack];
        let newBoard = [...localBoard];
        let recalled = false;
        newBoard.forEach((tile: any, index: number) => {
           if (tile && !tile.isLocked) {
               const emptyIdx = newRack.findIndex(t => t === null);
               if (emptyIdx !== -1) {
                   newRack[emptyIdx] = tile;
                   newBoard[index] = null;
                   recalled = true;
               }
           }
        });
        if (recalled) {
            setRack(newRack);
            setLocalBoard(newBoard);
        }
        setTargetSquare(null);
        setLastPlacedIndex(null);
        setPlayDirection(null);
        setSelectedRackIndex(null);
        setInvalidWords([]);
    }
  }, [isMyTurn]);

  useEffect(() => {
    if (!isProjector && isMyTurn && !hasDrawnInitialHand && globalBag?.length > 0) {
      let newBag = [...globalBag];
      const newRack = rack.map((slot: any) => {
        if (slot === null && newBag.length > 0) {
          return newBag.pop();
        }
        return slot;
      });
      setRack(newRack);
      setHasDrawnInitialHand(true);
      onUpdateLiveState({ bag: newBag });
    }
  }, [isMyTurn, hasDrawnInitialHand, globalBag, isProjector]);

  const shuffleRack = () => {
      let newRack = [...rack];
      for (let i = newRack.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [newRack[i], newRack[j]] = [newRack[j], newRack[i]];
      }
      setRack(newRack);
      setSelectedRackIndex(null);
  };

  const handleBoardClick = (index: number) => {
    if (!isMyTurn || isValidating) return; 
    setSelectedRackIndex(null); 
    setInvalidWords([]); // Clear errors on interaction

    if (localBoard[index]?.isLocked) return; 
    
    if (localBoard[index] && !localBoard[index].isLocked) {
      const emptyRackIndex = rack.findIndex((t: any) => t === null);
      if (emptyRackIndex !== -1) {
        const newRack = [...rack];
        const newBoard = [...localBoard];
        newRack[emptyRackIndex] = newBoard[index];
        newBoard[index] = null;
        setRack(newRack);
        setLocalBoard(newBoard);
        setTargetSquare(index); 
        setLastPlacedIndex(null);
        setPlayDirection(null);
      }
      return;
    }
    setTargetSquare(index);
  };

  const handleRackClick = (idx: number) => {
    if (isValidating) return;
    setInvalidWords([]); 

    if (targetSquare !== null) {
      if (!isMyTurn) return;
      if (!rack[idx]) return;

      if (!localBoard[targetSquare]) {
        const newBoard = [...localBoard];
        const newRack = [...rack];
        newBoard[targetSquare] = { ...newRack[idx], isLocked: false };
        newRack[idx] = null;
        setLocalBoard(newBoard);
        setRack(newRack);

        let currentDirection = playDirection;
        if (lastPlacedIndex !== null) {
            const delta = targetSquare - lastPlacedIndex;
            if (delta === 1 || delta === BOARD_SIZE) {
                currentDirection = delta;
                setPlayDirection(delta);
            } else {
                currentDirection = null;
                setPlayDirection(null);
            }
        }
        setLastPlacedIndex(targetSquare);

        if (currentDirection !== null) {
            const nextSquare = targetSquare + currentDirection;
            const isHorizontalValid = currentDirection === 1 && (targetSquare % BOARD_SIZE !== BOARD_SIZE - 1);
            const isVerticalValid = currentDirection === BOARD_SIZE && (targetSquare + BOARD_SIZE < BOARD_SIZE * BOARD_SIZE);
            if ((isHorizontalValid || isVerticalValid) && !newBoard[nextSquare]) {
                setTargetSquare(nextSquare);
            } else {
                setTargetSquare(null);
            }
        } else {
            setTargetSquare(null);
        }
      }
      return;
    }

    if (selectedRackIndex === null) {
        if (rack[idx]) {
            setSelectedRackIndex(idx);
        }
    } else {
        if (selectedRackIndex === idx) {
            setSelectedRackIndex(null); 
        } else {
            const newRack = [...rack];
            const temp = newRack[idx];
            newRack[idx] = newRack[selectedRackIndex];
            newRack[selectedRackIndex] = temp;
            setRack(newRack);
            setSelectedRackIndex(null);
        }
    }
  };

  const recallAll = () => {
    if (isValidating) return;
    const newRack = [...rack];
    const newBoard = [...localBoard];
    newBoard.forEach((tile: any, index: number) => {
      if (tile && !tile.isLocked) {
        const emptyIdx = newRack.findIndex((t: any) => t === null);
        if (emptyIdx !== -1) {
          newRack[emptyIdx] = tile;
          newBoard[index] = null;
        }
      }
    });
    setLocalBoard(newBoard);
    setRack(newRack);
    setTargetSquare(null);
    setLastPlacedIndex(null);
    setPlayDirection(null);
    setInvalidWords([]);
  };

  // ==========================================
  // MATCHMAKING & GAMEPLAY ACTIONS
  // ==========================================
  const joinLobby = () => {
    const displayName = studentId.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ');
    const newPlayers = { ...players, [studentId]: { id: studentId, name: displayName.charAt(0).toUpperCase() + displayName.slice(1) } };
    onUpdateLiveState({ players: newPlayers });
  };

  const initializeFFA = () => {
    const playerIds = Object.keys(players);
    const newTeams: any = {};
    const newScores: any = {};

    playerIds.forEach((pId, idx) => {
        const tId = `p_${idx}`;
        newTeams[tId] = {
            id: tId,
            order: idx,
            name: players[pId].name, 
            color: INDIVIDUAL_COLORS[idx % INDIVIDUAL_COLORS.length].color,
            textColor: INDIVIDUAL_COLORS[idx % INDIVIDUAL_COLORS.length].textColor,
            members: [pId] 
        };
        newScores[tId] = 0;
    });

    onUpdateLiveState({ 
        gameStatus: 'lobby_naming', 
        teams: newTeams, 
        scores: newScores,
        timeLimit: selectedTime 
    });
  };

  const submitTeamName = (name: string) => {
    if (name.trim() && myTeamId) {
        const updatedTeams = { ...teams };
        updatedTeams[myTeamId].name = name;
        onUpdateLiveState({ teams: updatedTeams });
    }
  };

  const startGame = () => {
    onUpdateLiveState({ gameStatus: 'playing', turnEndTime: Date.now() + timeLimit * 1000 });
  };

  const passTurn = () => {
    if (!isProjector) recallAll(); 
    if (teamArray.length === 0) return;
    onUpdateLiveState({
      activeTeamIndex: (activeTeamIndex + 1) % teamArray.length,
      turnEndTime: Date.now() + timeLimit * 1000
    });
  };

  // 🔥 DICTIONARY VALIDATION ENGINE
  const handleInitiateCommit = async () => {
    let turnScore = 0;
    const placedIndices: number[] = [];

    localBoard.forEach((tile: any, idx: number) => {
      if (tile && !tile.isLocked) {
        turnScore += tile.value;
        placedIndices.push(idx);
      }
    });

    if (turnScore === 0) return; 

    setIsValidating(true);
    setInvalidWords([]);

    const foundWords = new Set<string>();
    const getTile = (r: number, c: number) => r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE ? localBoard[r * BOARD_SIZE + c] : null;

    // Scan for words
    placedIndices.forEach(idx => {
        const r = Math.floor(idx / BOARD_SIZE);
        const c = idx % BOARD_SIZE;

        // Horizontals
        let left = c, right = c;
        while (left > 0 && getTile(r, left - 1)) left--;
        while (right < BOARD_SIZE - 1 && getTile(r, right + 1)) right++;
        if (right > left) {
            let word = '';
            for (let i = left; i <= right; i++) word += getTile(r, i)?.letter || '';
            foundWords.add(word);
        }

        // Verticals
        let top = r, bottom = r;
        while (top > 0 && getTile(top - 1, c)) top--;
        while (bottom < BOARD_SIZE - 1 && getTile(bottom + 1, c)) bottom++;
        if (bottom > top) {
            let word = '';
            for (let i = top; i <= bottom; i++) word += getTile(i, c)?.letter || '';
            foundWords.add(word);
        }
    });

    let extractedWords = Array.from(foundWords);
    if (extractedWords.length === 0 && placedIndices.length > 0) {
        // Fallback if they placed an isolated tile
        extractedWords = [placedIndices.map(idx => localBoard[idx].letter).join('')];
    }

    // Ping Dictionary API
    const failedWords: string[] = [];
    
    await Promise.all(extractedWords.map(async (word) => {
        if (word.length < 2) return; // API fails on single letters, which are technically not words anyway
        try {
            const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            if (!res.ok) {
                failedWords.push(word);
            }
        } catch (err) {
            console.error("Dictionary API failed:", err);
            // Ignore network errors so game doesn't hard-lock if API is down
        }
    }));

    setIsValidating(false);

    if (failedWords.length > 0) {
        setInvalidWords(failedWords);
        return; // Halt turn
    }

    // Success! Save extracted words and proceed
    setCurrentTurnScore(turnScore);
    setCurrentTurnWords(extractedWords);
    setPendingSentence(true);
  };

  const commitTurn = (withSentence: boolean) => {
    let bonus = 0;
    let sentencePayload = null;

    if (withSentence && sentenceText.trim().length > 3) {
        bonus = 5;
        sentencePayload = {
            playerName: myTeamEntry?.name || players[studentId]?.name || "Combatant",
            text: sentenceText.trim(),
            timestamp: Date.now(),
            bonusAmount: bonus
        };
    }

    const lockedBoard = localBoard.map((t: any) => t && !t.isLocked ? { ...t, isLocked: true } : t);
    const updatedScores = { ...scores, [myTeamId]: (scores[myTeamId] || 0) + currentTurnScore + bonus };
    const currentTeamWordsLog = teamWords[myTeamId] || [];
    const updatedTeamWords = { ...teamWords, [myTeamId]: [...currentTeamWordsLog, ...currentTurnWords] };

    let newBag = [...(globalBag || [])];
    let newRack = rack.map((slot: any) => {
      if (slot === null && newBag.length > 0) {
        return newBag.pop();
      }
      return slot;
    });
    setRack(newRack);

    const payload: any = {
      board: lockedBoard,
      scores: updatedScores,
      teamWords: updatedTeamWords, 
      bag: newBag, 
      activeTeamIndex: teamArray.length > 1 ? (activeTeamIndex + 1) % teamArray.length : 0,
      turnEndTime: Date.now() + timeLimit * 1000
    };

    if (sentencePayload) {
        payload.latestSentence = sentencePayload;
    }

    onUpdateLiveState(payload);
    
    setPendingSentence(false);
    setSentenceText("");
    setCurrentTurnWords([]);
    setCurrentTurnScore(0);
  };

  // ==========================================
  // RENDER: PROJECTOR VIEW
  // ==========================================
  if (isProjector) {
    if (gameStatus === 'lobby_join') {
      const joinedCount = Object.keys(players).length;
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-12 wood-bg text-white">
          <h1 className="text-[10vh] font-bold playfair-font text-amber-400 mb-4 drop-shadow-2xl">Littera Marmoris</h1>
          
          <div className="flex items-center gap-4 text-4xl font-black mb-12 text-slate-300">
             <Users size={48} className="text-emerald-400 animate-pulse" /> {joinedCount} {joinedCount === 1 ? 'Player' : 'Players'} in Lobby
          </div>

          <div className="mb-12 flex flex-col items-center animate-in slide-in-from-bottom-4">
             <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Select Turn Duration</p>
             <div className="flex gap-4">
                 {[
                     { label: '1 Min', val: 60 },
                     { label: '2 Min', val: 120 },
                     { label: '5 Min', val: 300 },
                     { label: '10 Min', val: 600 }
                 ].map(t => (
                     <button 
                         key={t.val} 
                         onClick={() => setSelectedTime(t.val)}
                         className={`px-8 py-3 rounded-2xl font-black text-lg transition-all border-2 ${
                             selectedTime === t.val 
                             ? 'bg-amber-500 border-amber-400 text-amber-950 shadow-[0_0_20px_rgba(245,158,11,0.4)] scale-105' 
                             : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-amber-500/50 hover:text-amber-200'
                         }`}
                     >
                         {t.label}
                     </button>
                 ))}
             </div>
          </div>

          <button 
             disabled={joinedCount < 1}
             onClick={initializeFFA}
             className="px-12 py-6 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-[2.5rem] font-black text-3xl shadow-[0_20px_50px_rgba(79,70,229,0.4)] transition-all border-4 border-indigo-400 active:scale-95 flex items-center gap-4"
          >
             Initialize Duel <FastForward size={32} />
          </button>
        </div>
      );
    }

    if (gameStatus === 'lobby_naming') {
        return (
            <div className="w-full h-full flex flex-col p-12 wood-bg text-white overflow-hidden">
                <div className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-[6vh] font-bold playfair-font text-amber-400 drop-shadow-lg">Establish Your Legend</h1>
                        <p className="text-xl font-bold text-slate-400 uppercase tracking-widest">Players: Name your profile or keep your alias</p>
                    </div>
                    <button onClick={startGame} className="px-12 py-6 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full font-black text-2xl uppercase tracking-widest shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-transform active:scale-95 flex items-center gap-3">
                        <CheckCircle2 size={24}/> Begin Duel
                    </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 overflow-y-auto custom-scrollbar pb-8">
                    {teamArray.map((t: any) => (
                        <div key={t.id} className={`${t.color} p-8 rounded-[2.5rem] shadow-xl border-4 border-white/20 animate-in zoom-in-95 duration-500 flex flex-col items-center justify-center text-center`}>
                            <div className="w-20 h-20 bg-black/20 rounded-full flex items-center justify-center mb-4">
                                <User size={40} className="text-white" />
                            </div>
                            <h2 className="text-3xl font-black uppercase tracking-tight leading-tight">{t.name}</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mt-2">Active Combatant</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
      <div className="w-full h-full flex p-12 wood-bg text-white gap-12 overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="mb-8 flex items-center gap-4 animate-in slide-in-from-top-8">
             <div className={`px-6 py-2 rounded-full border-2 shadow-lg text-white font-black uppercase tracking-widest text-sm ${activeTeam?.color || 'bg-slate-700'} border-white/20`}>
                {activeTeam?.name || 'Waiting'}'s Turn
             </div>
             <div className="bg-slate-900/80 backdrop-blur-md px-5 py-2 rounded-full border border-slate-700 shadow-xl flex items-center gap-3">
                <Clock className="text-amber-400 w-4 h-4" />
                <span className="text-xl font-mono font-bold text-amber-100">{timeLeft}s</span>
             </div>
          </div>
          <div className="board-grid bg-[#d0c8b6] p-2 rounded-lg shadow-2xl border-[4px] border-[#8b7355]">
            {(globalBoard || []).map((tile: any, index: number) => {
               const r = Math.floor(index / BOARD_SIZE);
               const c = index % BOARD_SIZE;
               const type = getSquareType(r, c);
               let bgClass = "bg-[#e8e4d9]";
               if (type === 'TW') bgClass = "bg-[#d9534f]";
               else if (type === 'DW') bgClass = "bg-[#f0ad4e]";
               else if (type === 'TL') bgClass = "bg-[#5bc0de]";
               else if (type === 'DL') bgClass = "bg-[#a3c2c2]";
               return (
                 <div key={index} className={`w-10 h-10 lg:w-14 lg:h-14 relative flex items-center justify-center border border-[#c4bcab] ${bgClass} shadow-inner`}>
                   {!tile && type === 'CT' && <Star className="text-amber-100 opacity-70 w-6 h-6" fill="currentColor" />}
                   {tile && <MarbleTile tile={tile} isLocked={true} className="w-[95%] h-[95%]" />}
                 </div>
               );
            })}
          </div>
        </div>
        <div className="w-[400px] flex flex-col gap-6 pt-24">
          <div className="bg-slate-800/80 backdrop-blur-md p-8 rounded-3xl border border-slate-700/50 shadow-xl flex flex-col">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-700 shrink-0">
              <h2 className="text-2xl font-bold flex items-center gap-3"><Trophy className="text-amber-400"/> Scores</h2>
              <span className="text-slate-400 font-mono text-sm">{globalBag?.length || 0} tiles left</span>
            </div>
            
            <div className="space-y-4 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
              {teamArray.map((t: any) => {
                const playerWords = teamWords[t.id] || [];
                return (
                <div key={t.id} className={`flex flex-col p-4 rounded-2xl border-2 transition-colors ${activeTeamIndex === t.order ? 'border-white bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'border-transparent bg-slate-900/50'}`}>
                  <div className="flex justify-between items-center">
                      <span className={`font-bold text-xl ${t.textColor}`}>{t.name}</span>
                      <span className="text-3xl font-black">{scores?.[t.id] || 0}</span>
                  </div>
                  {playerWords.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-white/10">
                          {playerWords.map((w: string, i: number) => (
                              <span key={i} className="px-2 py-1 bg-black/30 rounded-md text-[10px] uppercase font-black tracking-widest text-slate-300">
                                  {w}
                              </span>
                          ))}
                      </div>
                  )}
                </div>
              )})}
            </div>
          </div>
          
          {latestSentence && (
            <div className="bg-amber-900/20 backdrop-blur-md p-6 rounded-3xl border-2 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.15)] animate-in slide-in-from-right duration-500">
              <h3 className="text-amber-400 font-black text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Star size={16} fill="currentColor" /> Bonus Claimed (+{latestSentence.bonusAmount})
              </h3>
              <p className="text-white text-xl font-medium italic mb-4 leading-snug">
                  "{latestSentence.text}"
              </p>
              <p className="text-amber-200/50 text-xs font-bold uppercase tracking-widest text-right">
                  — {latestSentence.playerName}
              </p>
            </div>
          )}

          <button onClick={passTurn} className="mt-auto py-4 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white rounded-2xl font-bold flex justify-center items-center gap-2 transition-colors border border-rose-500/30">
            <FastForward size={20}/> Skip Turn
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: STUDENT VIEW (Mobile)
  // ==========================================
  if (gameStatus === 'lobby_join') {
    const hasJoined = players[studentId];
    return (
      <div className="flex flex-col h-full w-full wood-bg p-6 justify-center items-center text-center">
        <h2 className="text-4xl font-bold text-amber-100 playfair-font mb-8 italic">Littera Marmoris</h2>
        {hasJoined ? (
            <div className="animate-in zoom-in duration-500 flex flex-col items-center">
                <div className="w-24 h-24 bg-emerald-500/20 text-emerald-400 rounded-[35%] flex items-center justify-center mb-6 border-4 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                    <CheckCircle2 size={48} />
                </div>
                <p className="text-2xl font-black text-white uppercase tracking-widest mb-4">Profile Synced</p>
                <p className="text-amber-200/50 font-bold animate-pulse">Awaiting duel initialization...</p>
            </div>
        ) : (
            <button 
              onClick={joinLobby}
              className="p-8 bg-indigo-600 hover:bg-indigo-500 rounded-[2.5rem] font-black text-2xl uppercase tracking-widest shadow-[0_0_40px_rgba(79,70,229,0.5)] transition-transform active:scale-95 text-white border-4 border-indigo-400"
            >
              Join the Duel
            </button>
        )}
      </div>
    );
  }

  if (gameStatus === 'lobby_naming') {
    if (!myTeamEntry) return <div className="wood-bg w-full h-full flex items-center justify-center text-slate-400">Spectator Mode</div>;
    return (
        <div className="flex flex-col h-full w-full wood-bg p-6 text-center">
            <div className={`p-10 rounded-[3rem] ${myTeamEntry.color} border-4 border-white/20 shadow-2xl mb-8 flex flex-col items-center`}>
                <div className="w-20 h-20 bg-black/20 rounded-full flex items-center justify-center mb-6">
                    <User size={40} className="text-white" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">Authenticated As</h3>
                <h2 className="text-4xl font-black text-white uppercase tracking-tight">{myTeamEntry.name}</h2>
            </div>
            <div className="bg-slate-900/80 backdrop-blur-md p-8 rounded-[2.5rem] border border-slate-700 shadow-xl">
                <label className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4 block flex items-center justify-center gap-2">
                    <PenTool size={14}/> Customize Alias
                </label>
                <div className="flex flex-col gap-4">
                    <input 
                        defaultValue={myTeamEntry.name}
                        onBlur={(e) => submitTeamName(e.target.value)} 
                        maxLength={15}
                        placeholder="Your Legend Name" 
                        className="w-full bg-slate-950 border-2 border-slate-700 rounded-2xl px-5 py-4 text-white text-xl font-bold outline-none focus:border-amber-500 transition-colors text-center"
                    />
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Name updates automatically on blur</p>
                </div>
            </div>
            <p className="mt-auto text-amber-200/50 font-bold animate-pulse text-sm">Waiting for Instructor to start...</p>
        </div>
    );
  }

  if (isMyTurn && pendingSentence) {
    return (
        <div className="flex flex-col h-full w-full wood-bg p-6 text-center animate-in zoom-in-95">
            <div className="flex-1 flex flex-col justify-center items-center max-w-sm mx-auto w-full">
                <div className="relative">
                    <div className="absolute inset-0 bg-amber-500 blur-2xl opacity-20 rounded-full" />
                    <Star size={72} className="text-amber-400 mb-6 relative z-10" fill="currentColor" />
                </div>
                
                <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">Bonus XP!</h2>
                <p className="text-amber-200/70 font-bold mb-8 text-sm px-4">Optional: Write a sentence using your newly placed word to earn +5 extra points.</p>
                
                <textarea 
                    value={sentenceText}
                    onChange={e => setSentenceText(e.target.value)}
                    placeholder="Type your sentence here..."
                    className="w-full bg-slate-950/80 border-2 border-slate-700 rounded-2xl p-5 text-white text-lg font-medium outline-none focus:border-amber-500 transition-colors mb-8 min-h-[140px] shadow-inner"
                />

                <div className="flex flex-col gap-3 w-full">
                    <button 
                        onClick={() => commitTurn(true)}
                        disabled={sentenceText.trim().length < 5}
                        className="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-amber-950 font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:shadow-none flex items-center justify-center gap-2"
                    >
                        <MessageSquare size={18} /> Submit & Claim +5 XP
                    </button>
                    <button 
                        onClick={() => commitTurn(false)}
                        className="w-full py-4 bg-transparent text-slate-500 hover:text-slate-300 font-black uppercase tracking-widest rounded-xl transition-colors"
                    >
                        Skip Bonus
                    </button>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full wood-bg p-2 overflow-hidden border-4 border-emerald-500/50">
      <div className={`flex justify-between items-center mb-2 p-3 rounded-xl border transition-colors ${isMyTurn ? 'bg-emerald-900/60 border-emerald-500/50' : 'bg-slate-900/60 border-slate-700'}`}>
         <span className={`${isMyTurn ? 'text-emerald-100 animate-pulse' : 'text-slate-400'} font-black uppercase tracking-widest flex items-center gap-2 text-sm transition-colors`}>
            <Clock size={16} /> {timeLeft}s Left
         </span>
         <span className={`${isMyTurn ? 'text-amber-400' : 'text-slate-500'} font-bold playfair-font truncate ml-4 max-w-[120px] text-right transition-colors`}>
            {isMyTurn ? "Your Turn" : `${activeTeam?.name}'s Turn`}
         </span>
      </div>

      <div className="flex-1 overflow-auto rounded-xl shadow-inner bg-[#d0c8b6] border-4 border-[#8b7355] relative no-scrollbar">
        <div className="board-grid absolute min-w-[750px] min-h-[750px] p-2">
          {(localBoard || []).map((tile: any, index: number) => {
            const r = Math.floor(index / BOARD_SIZE);
            const c = index % BOARD_SIZE;
            const type = getSquareType(r, c);
            let bgClass = "bg-[#e8e4d9]";
            if (type === 'TW') bgClass = "bg-[#d9534f]";
            else if (type === 'DW') bgClass = "bg-[#f0ad4e]";
            else if (type === 'TL') bgClass = "bg-[#5bc0de]";
            else if (type === 'DL') bgClass = "bg-[#a3c2c2]";
            const isTargeted = targetSquare === index;
            return (
              <div key={index} onClick={() => handleBoardClick(index)} className={`w-full h-full aspect-square border border-[#c4bcab] ${bgClass} shadow-inner flex items-center justify-center relative transition-all ${isTargeted ? 'ring-4 ring-inset ring-amber-400 z-20 bg-amber-100/50' : ''}`}>
                {!tile && type === 'CT' && <Star className="text-amber-100 opacity-70 w-8 h-8" fill="currentColor" />}
                {isTargeted && !tile && <div className="absolute inset-0 m-2 border-2 border-dashed border-amber-500 rounded-md animate-pulse" />}
                {tile && <MarbleTile tile={tile} isLocked={tile.isLocked} className="w-[90%] h-[90%]" />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2 bg-[#8b7355] rounded-xl p-2 border-b-4 border-[#5c4a35] w-full z-10 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
         
         {/* 🔥 ERROR BANNER */}
         {invalidWords.length > 0 && (
             <div className="bg-rose-500/90 text-white px-3 py-2 rounded-lg mb-2 flex items-center gap-2 text-xs font-bold shadow-sm animate-in slide-in-from-bottom-2">
                 <AlertTriangle size={14} /> Dictionary rejected: {invalidWords.join(', ')}
             </div>
         )}

         <div className="flex justify-between items-end mb-2 px-1">
             <p className={`text-[10px] font-black uppercase tracking-widest ${isMyTurn ? 'text-amber-200/50 animate-pulse' : 'text-slate-400'}`}>
                {isMyTurn ? (targetSquare === null ? 'Tap board to target' : 'Tap letter to deploy') : 'Rearrange your rack'}
             </p>
             <button onClick={shuffleRack} className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg active:scale-95 transition-colors border border-slate-700 shadow-sm">
                 <Shuffle size={14} />
             </button>
         </div>

         <div className="flex gap-1 bg-[#4a3b29] p-2 rounded-lg w-full justify-center min-h-[3.5rem]">
            {rack.map((tile: any, idx: number) => {
              const isRackSelected = selectedRackIndex === idx;
              return (
                <div 
                  key={idx} 
                  onClick={() => handleRackClick(idx)} 
                  className={`w-10 h-10 rounded-md transition-all ${!tile ? 'bg-black/20' : ''} ${isRackSelected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-[#4a3b29] scale-105' : ''}`}
                >
                   {tile && <MarbleTile tile={tile} className="w-full h-full" />}
                </div>
              );
            })}
         </div>
      </div>

      <div className="flex gap-2 mt-2 pb-2">
         <button onClick={recallAll} disabled={isValidating} className="flex-1 py-3 bg-slate-700 text-white rounded-xl font-bold flex justify-center items-center gap-2 active:scale-95 transition-colors hover:bg-slate-600 disabled:opacity-50">
             <ArrowDownToLine size={18}/> Recall
         </button>
         
         {isMyTurn ? (
             <button onClick={handleInitiateCommit} disabled={isValidating} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg active:scale-95 border-b-4 border-emerald-800 transition-colors hover:bg-emerald-500 disabled:opacity-50 disabled:border-emerald-600">
                 {isValidating ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18}/>} 
                 {isValidating ? 'Checking...' : 'Play Word'}
             </button>
         ) : (
             <div className="flex-1 py-3 bg-slate-800 text-slate-400 rounded-xl font-bold flex justify-center items-center gap-2 border-b-4 border-slate-900">
                 Waiting...
             </div>
         )}
      </div>
    </div>
  );
}
