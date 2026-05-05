import React, { useState, useEffect } from 'react';
import { Trophy, Clock, CheckCircle2, ShieldAlert, FastForward, ArrowDownToLine, Star, Users, UserPlus, PenTool, User, MessageSquare, Shuffle, Loader2, AlertTriangle, Zap, Rocket, BookOpen, RefreshCw, ZoomIn, ZoomOut, LocateFixed } from 'lucide-react';

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
  
  const dpPoints = [[1,7], [7,1], [7,13], [13,7]];
  if (dpPoints.some(([tr, tc]) => tr === r && tc === c)) return 'DP';
  
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

// ==========================================
// ASTROGRAM DATA TILE COMPONENT
// ==========================================
const DataTile = ({ tile, isSelected, isLocked, onClick, className = '' }: any) => {
  if (!tile) return null;
  return (
    <div
      onClick={!isLocked ? onClick : undefined}
      className={`relative flex items-center justify-center rounded-lg transition-all duration-300 data-tile select-none overflow-hidden ${
        isSelected ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-900 scale-110 z-10 shadow-[0_0_20px_rgba(99,102,241,0.5)] cursor-pointer' 
        : isLocked ? 'opacity-90 cursor-default' 
        : 'hover:scale-105 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] cursor-pointer group'
      } ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none mix-blend-overlay" />
      <span className="magister-font font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] text-xl relative z-10 mb-0.5 mr-0.5">
        {tile.letter}
      </span>
      <div className="absolute bottom-0.5 right-0.5 bg-slate-950/90 rounded border border-slate-700/50 px-[3px] py-[1px] shadow-md z-20 flex items-center justify-center min-w-[14px]">
        <span className="text-[10px] font-black font-mono text-amber-400 leading-none drop-shadow-sm">
          {tile.value}
        </span>
      </div>
    </div>
  );
};

// ==========================================
// MAIN ASTROGRAM COMPONENT
// ==========================================
export default function MarbleScrabble({ block, isProjector, liveState, studentId, onUpdateLiveState }: any) {
  const timeLimit = liveState?.timeLimit || block?.timePerTurnSeconds || 60;
  const [selectedTime, setSelectedTime] = useState(60);

  // SCIFI STYLES INJECTION
  useEffect(() => {
    if (!document.getElementById('marble-styles')) {
      const style = document.createElement('style');
      style.id = 'marble-styles';
      style.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Syncopate:wght@700&display=swap');
        .magister-font { font-family: 'Syncopate', sans-serif; letter-spacing: -1px; }
        .data-tile {
          background-color: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(8px);
          box-shadow: inset 0 1px 1px rgba(255,255,255,0.2), inset 0 -1px 4px rgba(0,0,0,0.5), 0 4px 6px rgba(0,0,0,0.4);
          border: 1px solid rgba(99, 102, 241, 0.3);
        }
        .data-text { color: #f8fafc; text-shadow: 0 0 10px rgba(255,255,255,0.6); }
        .scifi-bg { 
            background-color: #020617; 
            background-image: 
                radial-gradient(circle at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 70%), 
                radial-gradient(circle at 100% 100%, rgba(217,70,239,0.1) 0%, transparent 50%); 
        }
        .board-grid { display: grid; grid-template-columns: repeat(${BOARD_SIZE}, minmax(0, 1fr)); gap: 3px; }
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
        latestDiscoveries: [], 
        activeTeamIndex: 0,
        turnEndTime: null,
        isExtraTurn: false,
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
  const latestDiscoveries: {word: string, def: string}[] = liveState?.latestDiscoveries || [];
  const activeTeamIndex = liveState?.activeTeamIndex || 0;
  const turnEndTime = liveState?.turnEndTime;
  const latestSentence = liveState?.latestSentence;
  const isExtraTurn = liveState?.isExtraTurn || false;
  
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
  const [hasDrawnInitialHand, setHasDrawnInitialHand] = useState(false);
  const [selectedRackIndex, setSelectedRackIndex] = useState<number | null>(null);
  
  const [pendingSentence, setPendingSentence] = useState(false);
  const [sentenceText, setSentenceText] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [invalidWords, setInvalidWords] = useState<string[]>([]);
  const [currentTurnWords, setCurrentTurnWords] = useState<{word: string, def: string}[]>([]);
  const [currentTurnScore, setCurrentTurnScore] = useState(0);

  // 🔥 TACTICAL HUD ZOOM STATE
  const [zoomLevel, setZoomLevel] = useState(1);
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.2, 1.8));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.2, 0.6));
  const handleZoomReset = () => setZoomLevel(1);

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
               const emptyIdx = newRack.findIndex((t: any) => t === null);
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
    setInvalidWords([]); 

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

  const handlePurge = () => {
    if (!isMyTurn || isValidating) return;
    if ((scores[myTeamId] || 0) < 10) return;

    let tilesToReturn: any[] = [];
    const newBoard = [...localBoard];
    
    newBoard.forEach((tile: any, index: number) => {
        if (tile && !tile.isLocked) {
            tilesToReturn.push(tile);
            newBoard[index] = null;
        }
    });

    rack.forEach(tile => {
        if (tile) tilesToReturn.push(tile);
    });

    let newBag = [...(globalBag || []), ...tilesToReturn];
    
    for (let i = newBag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newBag[i], newBag[j]] = [newBag[j], newBag[i]];
    }

    let newRack = Array(7).fill(null);
    newRack = newRack.map(() => {
        if (newBag.length > 0) return newBag.pop();
        return null;
    });

    setRack(newRack);
    setLocalBoard(newBoard);
    setTargetSquare(null);
    setLastPlacedIndex(null);
    setPlayDirection(null);
    setInvalidWords([]);
    setSelectedRackIndex(null);

    const updatedScores = { ...scores, [myTeamId]: (scores[myTeamId] || 0) - 10 };
    
    onUpdateLiveState({
        bag: newBag,
        scores: updatedScores,
        activeTeamIndex: teamArray.length > 1 ? (activeTeamIndex + 1) % teamArray.length : 0,
        turnEndTime: Date.now() + timeLimit * 1000,
        isExtraTurn: false
    });
  };

  // ==========================================
  // MATCHMAKING & GAMEPLAY ACTIONS
  // ==========================================
  const joinLobby = () => {
    const displayName = studentId.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ');
    const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${studentId}&backgroundColor=transparent`;
    const newPlayers = { 
        ...players, 
        [studentId]: { 
            id: studentId, 
            name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
            avatar: avatarUrl 
        } 
    };
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
            avatar: players[pId].avatar, 
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
      turnEndTime: Date.now() + timeLimit * 1000,
      isExtraTurn: false 
    });
  };

  const handleInitiateCommit = async () => {
    const placedIndices: number[] = [];
    localBoard.forEach((tile: any, idx: number) => {
      if (tile && !tile.isLocked) placedIndices.push(idx);
    });

    if (placedIndices.length === 0) return; 

    setIsValidating(true);
    setInvalidWords([]);

    const rows = Array.from(new Set(placedIndices.map((idx: number) => Math.floor(idx / BOARD_SIZE))));
    const cols = Array.from(new Set(placedIndices.map((idx: number) => idx % BOARD_SIZE)));
    
    if (rows.length > 1 && cols.length > 1) {
        setInvalidWords(["Tiles must be placed in a single row or column."]);
        setIsValidating(false);
        return;
    }

    const getTile = (r: number, c: number) => r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE ? localBoard[r * BOARD_SIZE + c] : null;

    let hasGap = false;
    if (rows.length === 1) {
        const r = rows[0];
        const minC = Math.min(...cols);
        const maxC = Math.max(...cols);
        for (let c = minC; c <= maxC; c++) {
            if (!getTile(r, c)) hasGap = true;
        }
    } else if (cols.length === 1) {
        const c = cols[0];
        const minR = Math.min(...rows);
        const maxR = Math.max(...rows);
        for (let r = minR; r <= maxR; r++) {
            if (!getTile(r, c)) hasGap = true;
        }
    }

    if (hasGap) {
        setInvalidWords(["Tiles must form a contiguous word without gaps."]);
        setIsValidating(false);
        return;
    }

    const isFirstTurn = !localBoard.some((t: any) => t && t.isLocked);
    if (isFirstTurn) {
        if (!placedIndices.includes(112)) { 
            setInvalidWords(["The first word must cover the center star."]);
            setIsValidating(false);
            return;
        }
        if (placedIndices.length < 2) {
            setInvalidWords(["The first word must be at least 2 letters long."]);
            setIsValidating(false);
            return;
        }
    } else {
        let touchesLocked = false;
        placedIndices.forEach((idx: number) => {
            const r = Math.floor(idx / BOARD_SIZE);
            const c = idx % BOARD_SIZE;
            if (getTile(r-1, c)?.isLocked || getTile(r+1, c)?.isLocked || getTile(r, c-1)?.isLocked || getTile(r, c+1)?.isLocked) {
                touchesLocked = true;
            }
        });
        if (!touchesLocked) {
            setInvalidWords(["New tiles must connect to an existing word."]);
            setIsValidating(false);
            return;
        }
    }

    const scannedWords = new Set<string>();
    const foundWordsList: { word: string; score: number }[] = [];
    let totalCalculatedScore = 0;

    placedIndices.forEach((idx: number) => {
        const r = Math.floor(idx / BOARD_SIZE);
        const c = idx % BOARD_SIZE;

        let left = c, right = c;
        while (left > 0 && getTile(r, left - 1)) left--;
        while (right < BOARD_SIZE - 1 && getTile(r, right + 1)) right++;
        if (right > left) {
            const wordKey = `H-${r}-${left}-${right}`;
            if (!scannedWords.has(wordKey)) {
                scannedWords.add(wordKey);
                let wordStr = '';
                let wordScore = 0;
                let wordMult = 1;

                for (let i = left; i <= right; i++) {
                    const t = getTile(r, i);
                    let lVal = t.value;
                    if (!t.isLocked) { 
                        const sq = getSquareType(r, i);
                        if (sq === 'DL') lVal *= 2;
                        if (sq === 'TL') lVal *= 3;
                        if (sq === 'DW' || sq === 'CT') wordMult *= 2;
                        if (sq === 'TW') wordMult *= 3;
                    }
                    wordScore += lVal;
                    wordStr += t.letter;
                }
                foundWordsList.push({ word: wordStr, score: wordScore * wordMult });
                totalCalculatedScore += (wordScore * wordMult);
            }
        }

        let top = r, bottom = r;
        while (top > 0 && getTile(top - 1, c)) top--;
        while (bottom < BOARD_SIZE - 1 && getTile(bottom + 1, c)) bottom++;
        if (bottom > top) {
            const wordKey = `V-${c}-${top}-${bottom}`;
            if (!scannedWords.has(wordKey)) {
                scannedWords.add(wordKey);
                let wordStr = '';
                let wordScore = 0;
                let wordMult = 1;

                for (let i = top; i <= bottom; i++) {
                    const t = getTile(i, c);
                    let lVal = t.value;
                    if (!t.isLocked) {
                        const sq = getSquareType(i, c);
                        if (sq === 'DL') lVal *= 2;
                        if (sq === 'TL') lVal *= 3;
                        if (sq === 'DW' || sq === 'CT') wordMult *= 2;
                        if (sq === 'TW') wordMult *= 3;
                    }
                    wordScore += lVal;
                    wordStr += t.letter;
                }
                foundWordsList.push({ word: wordStr, score: wordScore * wordMult });
                totalCalculatedScore += (wordScore * wordMult);
            }
        }
    });

    const extractedWords = foundWordsList.map(w => w.word);
    
    const validWordsData: {word: string, def: string}[] = [];
    const failedWords: string[] = [];
    
    await Promise.all(extractedWords.map(async (word) => {
        if (word.length < 2) return; 
        
        let foundDefinition = false;

        try {
            const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            const data = await res.json();
            
            if (res.ok && Array.isArray(data)) {
                let def = data[0]?.meanings?.[0]?.definitions?.[0]?.definition || "Definition acquired.";
                validWordsData.push({ word: word.toUpperCase(), def });
                foundDefinition = true;
            }
        } catch (err) {
            console.warn("Primary Dictionary API failed for", word, err);
        }

        if (!foundDefinition) {
            try {
                const res2 = await fetch(`https://api.datamuse.com/words?sp=${word}&md=d&max=1`);
                const data2 = await res2.json();
                
                if (data2 && data2.length > 0 && data2[0].word.toLowerCase() === word.toLowerCase()) {
                    let def = "Definition securely archived.";
                    if (data2[0].defs && data2[0].defs.length > 0) {
                        def = data2[0].defs[0].split('\t').pop() || def;
                    }
                    validWordsData.push({ word: word.toUpperCase(), def });
                    foundDefinition = true;
                }
            } catch (err) {
                console.warn("Fallback Datamuse API failed for", word, err);
            }
        }

        if (!foundDefinition) {
            failedWords.push(word.toUpperCase());
        }
    }));

    setIsValidating(false);

    if (failedWords.length > 0) {
        setInvalidWords(failedWords);
        return; 
    }

    setCurrentTurnScore(totalCalculatedScore);
    setCurrentTurnWords(validWordsData);
    setPendingSentence(true);
  };

  const commitTurn = (withSentence: boolean) => {
    let bonus = 0;
    let sentencePayload = null;
    let triggeredDP = false;

    localBoard.forEach((tile: any, idx: number) => {
      if (tile && !tile.isLocked) {
         const r = Math.floor(idx / BOARD_SIZE);
         const c = idx % BOARD_SIZE;
         if (getSquareType(r, c) === 'DP') {
             triggeredDP = true;
         }
      }
    });

    if (withSentence && sentenceText.trim().length > 3) {
        bonus = 5;
        sentencePayload = {
            playerName: myTeamEntry?.name || players[studentId]?.name || "Explorer",
            text: sentenceText.trim(),
            timestamp: Date.now(),
            bonusAmount: bonus
        };
    }

    const lockedBoard = localBoard.map((t: any) => t && !t.isLocked ? { ...t, isLocked: true } : t);
    const updatedScores = { ...scores, [myTeamId]: (scores[myTeamId] || 0) + currentTurnScore + bonus };
    
    const currentTeamWordsLog = teamWords[myTeamId] || [];
    const extractedWordStrings = currentTurnWords.map(w => w.word);
    const updatedTeamWords = { ...teamWords, [myTeamId]: [...currentTeamWordsLog, ...extractedWordStrings] };

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
      latestDiscoveries: currentTurnWords, 
      bag: newBag, 
      activeTeamIndex: triggeredDP ? activeTeamIndex : (teamArray.length > 1 ? (activeTeamIndex + 1) % teamArray.length : 0),
      turnEndTime: Date.now() + timeLimit * 1000,
      isExtraTurn: triggeredDP 
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

  const getSquareClasses = (r: number, c: number, tile: any, isTargeted: boolean) => {
      const type = getSquareType(r, c);
      let base = "bg-slate-800/40 border-slate-700/50"; 
      
      if (type === 'TW') base = "bg-rose-500/20 border-rose-500/40 shadow-[inset_0_0_15px_rgba(244,63,94,0.3)]";
      else if (type === 'DW') base = "bg-amber-500/20 border-amber-500/40 shadow-[inset_0_0_15px_rgba(245,158,11,0.3)]";
      else if (type === 'TL') base = "bg-cyan-500/20 border-cyan-500/40 shadow-[inset_0_0_15px_rgba(6,182,212,0.3)]";
      else if (type === 'DL') base = "bg-emerald-500/20 border-emerald-500/40 shadow-[inset_0_0_15px_rgba(16,185,129,0.3)]";
      else if (type === 'CT') base = "bg-indigo-500/20 border-indigo-500/40 shadow-[inset_0_0_15px_rgba(99,102,241,0.3)]";
      else if (type === 'DP') base = "bg-fuchsia-500/20 border-fuchsia-500/40 shadow-[inset_0_0_15px_rgba(217,70,239,0.3)]";

      if (isTargeted) return `${base} ring-2 ring-inset ring-amber-400 z-20 bg-amber-500/20 shadow-[inset_0_0_20px_rgba(245,158,11,0.4)]`;
      return base;
  };

  // ==========================================
  // RENDER: PROJECTOR VIEW
  // ==========================================
  if (isProjector) {
    if (gameStatus === 'lobby_join') {
      const joinedCount = Object.keys(players).length;
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-12 scifi-bg text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none mix-blend-overlay" />
          <h1 className="text-[10vh] font-black magister-font text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 mb-4 drop-shadow-2xl">ASTROGRAM</h1>
          
          <div className="flex items-center gap-4 text-4xl font-black mb-12 text-slate-300 relative z-10">
             <Users size={48} className="text-emerald-400 animate-pulse" /> {joinedCount} {joinedCount === 1 ? 'Explorer' : 'Explorers'} Connected
          </div>

          <div className="mb-12 flex flex-col items-center animate-in slide-in-from-bottom-4 relative z-10">
             <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Set Turn Duration</p>
             <div className="flex gap-4">
                 {[
                     { label: '1 Min', val: 60 },
                     { label: '2 Min', val: 120 },
                     { label: '5 Min', val: 300 },
                     { label: '10 Min', val: 600 }
                 ].map((t: any) => (
                     <button 
                         key={t.val} 
                         onClick={() => setSelectedTime(t.val)}
                         className={`px-8 py-3 rounded-2xl font-black text-lg transition-all border border-slate-700/50 backdrop-blur-md ${
                             selectedTime === t.val 
                             ? 'bg-indigo-500/20 text-indigo-300 shadow-[inset_0_0_20px_rgba(99,102,241,0.5)] ring-2 ring-indigo-400 scale-105' 
                             : 'bg-slate-900/50 text-slate-500 hover:text-indigo-300'
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
             className="relative z-10 px-12 py-6 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-3xl font-black text-3xl shadow-[0_0_40px_rgba(79,70,229,0.4)] transition-all border border-indigo-400 active:scale-95 flex items-center gap-4 group"
          >
             Launch Astrogram <Rocket className="group-hover:animate-pulse" size={32} />
          </button>
        </div>
      );
    }

    if (gameStatus === 'lobby_naming') {
        return (
            <div className="w-full h-full flex flex-col p-12 scifi-bg text-white overflow-hidden relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none mix-blend-overlay" />
                <div className="flex justify-between items-center mb-12 relative z-10">
                    <div>
                        <h1 className="text-[6vh] font-black magister-font text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-400 drop-shadow-lg">Awaiting Launch</h1>
                        <p className="text-xl font-bold text-slate-400 uppercase tracking-widest mt-2">Explorers: Configure your cosmic alias on your devices</p>
                    </div>
                    <button onClick={startGame} className="px-12 py-6 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/50 backdrop-blur-md rounded-full font-black text-2xl uppercase tracking-widest shadow-[0_0_30px_rgba(16,185,129,0.2)] transition-transform active:scale-95 flex items-center gap-3">
                        <CheckCircle2 size={24}/> Launch Expedition
                    </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 overflow-y-auto custom-scrollbar pb-8 relative z-10">
                    {teamArray.map((t: any) => (
                        <div key={t.id} className={`p-8 rounded-3xl shadow-xl border border-slate-700/50 bg-slate-900/40 backdrop-blur-md animate-in zoom-in-95 duration-500 flex flex-col items-center justify-center text-center relative overflow-hidden`}>
                            <div className={`absolute top-0 left-0 w-full h-1 ${t.color}`} />
                            {t.avatar ? (
                                <img src={t.avatar} className="w-20 h-20 bg-slate-950 rounded-full mb-4 border border-slate-800 shadow-inner" alt={t.name} />
                            ) : (
                                <div className="w-20 h-20 bg-slate-950 rounded-full flex items-center justify-center mb-4 border border-slate-800 shadow-inner">
                                    <User size={32} className={t.textColor} />
                                </div>
                            )}
                            <h2 className="text-3xl font-black uppercase tracking-tight leading-tight text-white">{t.name}</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-2">Ready</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
      <div className="w-full h-full flex p-8 scifi-bg text-white gap-8 overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-5 pointer-events-none mix-blend-overlay" />
        
        <div className="flex-1 flex flex-col items-center justify-center relative z-10">
          <div className="mb-6 flex items-center gap-4 animate-in slide-in-from-top-8">
             <div className={`pl-2 pr-6 py-2 rounded-full border shadow-lg text-white font-black uppercase tracking-widest text-sm bg-slate-900/60 backdrop-blur-md border-slate-700 flex items-center gap-3`}>
                {activeTeam?.avatar ? (
                    <img src={activeTeam.avatar} className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600" />
                ) : (
                    <User className="w-8 h-8 p-1 rounded-full bg-slate-800" />
                )}
                <span className={activeTeam?.textColor}>{activeTeam?.name || 'Waiting'}</span>'s Turn
                {isExtraTurn && <span className="bg-fuchsia-500 text-white text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 ml-2"><FastForward size={12}/> DOUBLE PLAY</span>}
             </div>
             <div className="bg-slate-900/80 backdrop-blur-md px-5 py-2 rounded-full border border-slate-700 shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center gap-3">
                <Clock className="text-amber-400 w-4 h-4" />
                <span className="text-xl font-mono font-bold text-amber-100">{timeLeft}s</span>
             </div>
          </div>
          
          <div className="bg-slate-900/60 backdrop-blur-xl p-3 rounded-2xl shadow-2xl border border-slate-700/50">
            <div className="board-grid">
                {(globalBoard || []).map((tile: any, index: number) => {
                const r = Math.floor(index / BOARD_SIZE);
                const c = index % BOARD_SIZE;
                const type = getSquareType(r, c);
                return (
                    <div key={index} className={`w-10 h-10 lg:w-14 lg:h-14 relative flex items-center justify-center transition-colors ${getSquareClasses(r, c, tile, false)}`}>
                    {!tile && type === 'CT' && <Star className="text-indigo-400 opacity-50 w-6 h-6 animate-pulse" fill="currentColor" />}
                    {!tile && type === 'DP' && <FastForward className="text-fuchsia-400 opacity-50 w-5 h-5 animate-pulse" fill="currentColor" />}
                    {tile && <DataTile tile={tile} isLocked={true} className="w-[90%] h-[90%]" />}
                    </div>
                );
                })}
            </div>
          </div>
        </div>

        <div className="w-[400px] flex flex-col gap-6 relative z-10">
          <div className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-700 shadow-2xl flex flex-col min-h-[40vh]">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800 shrink-0">
              <h2 className="text-2xl font-black magister-font flex items-center gap-3 text-slate-100"><Trophy className="text-indigo-400"/> RANKINGS</h2>
              <span className="text-slate-500 font-mono text-xs font-bold bg-slate-950 px-3 py-1 rounded-full border border-slate-800">{globalBag?.length || 0} ASTRO-TILES</span>
            </div>
            
            <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2 flex-1">
              {teamArray.map((t: any) => {
                const playerWords = teamWords[t.id] || [];
                const isActive = activeTeamIndex === t.order;
                return (
                <div key={t.id} className={`flex flex-col p-4 rounded-2xl border transition-all ${isActive ? 'bg-slate-800/80 border-slate-600 shadow-[0_0_20px_rgba(0,0,0,0.3)] scale-[1.02]' : 'border-transparent bg-slate-950/50'}`}>
                  <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                          {t.avatar && <img src={t.avatar} className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700" alt="avatar" />}
                          <span className={`font-black uppercase tracking-widest text-sm ${t.textColor}`}>{t.name}</span>
                      </div>
                      <span className="text-2xl font-mono font-black text-slate-100">{scores?.[t.id] || 0}</span>
                  </div>
                  {playerWords.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-800/50">
                          {playerWords.map((w: string, i: number) => (
                              <span key={i} className="px-2 py-1 bg-slate-900 rounded-md text-[9px] font-mono font-bold tracking-widest text-slate-400 border border-slate-800">
                                  {w}
                              </span>
                          ))}
                      </div>
                  )}
                </div>
              )})}
            </div>
          </div>
          
          {(latestDiscoveries.length > 0 || latestSentence) && (
            <div className="bg-indigo-900/20 backdrop-blur-xl p-6 rounded-3xl border border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.15)] animate-in slide-in-from-right duration-500 flex flex-col gap-4">
              
              {latestDiscoveries.length > 0 && (
                 <div>
                    <h3 className="text-cyan-400 font-black text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2">
                        <BookOpen size={14} fill="currentColor" /> Lexicon Databanks 
                    </h3>
                    <div className="space-y-3">
                        {latestDiscoveries.map((disc: any, idx: number) => (
                            <div key={idx} className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 shadow-inner">
                                <span className="font-black text-indigo-300 tracking-widest block mb-1">{disc.word}</span>
                                <span className="text-xs text-slate-300 font-medium leading-relaxed block">{disc.def}</span>
                            </div>
                        ))}
                    </div>
                 </div>
              )}

              {latestSentence && (
                 <div className="border-t border-indigo-500/20 pt-4 mt-2">
                    <h3 className="text-amber-400 font-black text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Star size={14} fill="currentColor" /> Intel Bonus (+{latestSentence.bonusAmount} XP)
                    </h3>
                    <p className="text-slate-100 text-sm font-medium italic mb-2 leading-relaxed">
                        "{latestSentence.text}"
                    </p>
                    <p className="text-indigo-300/50 text-[10px] font-bold uppercase tracking-widest text-right">
                        — {latestSentence.playerName}
                    </p>
                 </div>
              )}
            </div>
          )}

          <button onClick={passTurn} className="mt-auto py-4 bg-slate-900/50 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 rounded-2xl font-black uppercase tracking-widest flex justify-center items-center gap-2 transition-colors border border-slate-800 hover:border-rose-500/30">
            <FastForward size={16}/> Skip Turn
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
      <div className="flex flex-col h-full w-full scifi-bg p-6 justify-center items-center text-center relative">
        <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 magister-font mb-8">ASTROGRAM</h2>
        {hasJoined ? (
            <div className="animate-in zoom-in duration-500 flex flex-col items-center">
                <div className="w-24 h-24 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                    <CheckCircle2 size={48} />
                </div>
                <p className="text-xl font-black text-slate-200 uppercase tracking-widest mb-4">Connection Established</p>
                <p className="text-indigo-400/50 text-sm font-bold uppercase tracking-widest animate-pulse">Awaiting Launch Sequence...</p>
            </div>
        ) : (
            <button 
              onClick={joinLobby}
              className="p-8 bg-indigo-600/20 hover:bg-indigo-600/40 backdrop-blur-md rounded-[2rem] font-black text-xl uppercase tracking-widest shadow-[0_0_40px_rgba(79,70,229,0.3)] transition-all active:scale-95 text-indigo-100 border border-indigo-500/50"
            >
              Join the Stars
            </button>
        )}
      </div>
    );
  }

  if (gameStatus === 'lobby_naming') {
    if (!myTeamEntry) return <div className="scifi-bg w-full h-full flex items-center justify-center text-slate-500 font-bold uppercase tracking-widest">Spectator Mode</div>;
    return (
        <div className="flex flex-col h-full w-full scifi-bg p-6 text-center relative">
            <div className={`p-10 rounded-[2.5rem] bg-slate-900/60 backdrop-blur-xl border border-slate-700 shadow-2xl mb-8 flex flex-col items-center`}>
                {myTeamEntry.avatar ? (
                    <img src={myTeamEntry.avatar} className="w-20 h-20 bg-slate-950 rounded-full mb-6 border border-slate-800 shadow-inner" alt="Avatar" />
                ) : (
                    <div className="w-20 h-20 bg-slate-950 rounded-full flex items-center justify-center mb-6 border border-slate-800 shadow-inner">
                        <User size={32} className={myTeamEntry.textColor} />
                    </div>
                )}
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Explorer Alias</h3>
                <h2 className={`text-3xl font-black uppercase tracking-tight ${myTeamEntry.textColor}`}>{myTeamEntry.name}</h2>
            </div>
            <div className="bg-slate-900/80 backdrop-blur-md p-8 rounded-[2rem] border border-slate-800 shadow-xl">
                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-4 block flex items-center justify-center gap-2">
                    <PenTool size={14}/> Reconfigure Identifier
                </label>
                <div className="flex flex-col gap-4">
                    <input 
                        defaultValue={myTeamEntry.name}
                        onBlur={(e) => submitTeamName(e.target.value)} 
                        maxLength={15}
                        placeholder="Your Name" 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 text-white text-lg font-mono font-bold outline-none focus:border-indigo-500 transition-colors text-center shadow-inner"
                    />
                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Auto-syncs on blur</p>
                </div>
            </div>
            <p className="mt-auto text-indigo-400/50 font-bold uppercase tracking-widest text-xs animate-pulse">Awaiting launch...</p>
        </div>
    );
  }

  if (isMyTurn && pendingSentence) {
    return (
        <div className="flex flex-col h-full w-full scifi-bg p-6 text-center animate-in zoom-in-95 relative overflow-y-auto">
            <div className="flex-1 flex flex-col justify-center items-center max-w-sm mx-auto w-full relative z-10 py-12">
                <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 rounded-full" />
                    <Star size={72} className="text-indigo-400 mb-6 relative z-10" fill="currentColor" />
                </div>
                
                <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tight magister-font">COSMIC DISCOVERY</h2>
                
                <div className="bg-slate-900/80 border border-slate-700 rounded-2xl w-full p-4 mb-6 shadow-inner text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 border-b border-slate-800 pb-2">Valid Database Entries Found</p>
                    {currentTurnWords.map((disc: any, idx: number) => (
                        <div key={idx} className="mb-3 last:mb-0">
                            <span className="font-black text-indigo-300 block text-sm">{disc.word}</span>
                            <span className="text-xs text-slate-300 font-medium">{disc.def}</span>
                        </div>
                    ))}
                </div>

                <p className="text-slate-400 font-medium mb-4 text-sm px-4">Write a sentence using one of your newly formed words to earn +5 Star Power.</p>
                
                <textarea 
                    value={sentenceText}
                    onChange={e => setSentenceText(e.target.value)}
                    placeholder="Input contextual sentence..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-5 text-slate-200 text-lg font-medium outline-none focus:border-indigo-500 transition-colors mb-8 min-h-[120px] shadow-inner"
                />

                <div className="flex flex-col gap-3 w-full">
                    <button 
                        onClick={() => commitTurn(true)}
                        disabled={sentenceText.trim().length < 5}
                        className="w-full py-4 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/50 disabled:bg-slate-900 disabled:border-slate-800 disabled:text-slate-600 text-indigo-100 font-black uppercase tracking-widest rounded-xl transition-all shadow-lg disabled:shadow-none flex items-center justify-center gap-2"
                    >
                        <MessageSquare size={16} /> Submit Discovery
                    </button>
                    <button 
                        onClick={() => commitTurn(false)}
                        className="w-full py-4 bg-transparent text-slate-500 hover:text-slate-300 font-black uppercase tracking-widest rounded-xl transition-colors"
                    >
                        Bypass Bonus
                    </button>
                </div>
            </div>
        </div>
    );
  }

  // MAIN GAME RENDER (MOBILE APP)
  return (
    <div className="flex flex-col h-full w-full scifi-bg p-2 overflow-hidden relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-5 pointer-events-none mix-blend-overlay" />
      
      <div className={`relative z-10 flex justify-between items-center mb-3 p-3 rounded-2xl border backdrop-blur-md transition-colors ${isMyTurn ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-slate-900/40 border-slate-800'}`}>
         <span className={`${isMyTurn ? 'text-indigo-300 animate-pulse' : 'text-slate-500'} font-black uppercase tracking-widest flex items-center gap-2 text-xs transition-colors`}>
            <Clock size={14} /> {timeLeft}s
         </span>
         
         <div className="flex items-center gap-2">
            {isExtraTurn && isMyTurn && <FastForward size={14} className="text-fuchsia-400 animate-pulse" />}
            <span className={`${isMyTurn ? 'text-white' : 'text-slate-400'} font-black uppercase tracking-widest truncate max-w-[150px] text-right text-xs transition-colors`}>
                {isMyTurn ? "Your Turn" : `${activeTeam?.name}'s Turn`}
            </span>
            {activeTeam?.avatar && !isMyTurn && (
                <img src={activeTeam.avatar} className="w-5 h-5 rounded-full bg-slate-800" alt="Active Player" />
            )}
         </div>
      </div>

      <div className="relative z-10 flex-1 overflow-auto rounded-2xl shadow-inner bg-slate-900/40 backdrop-blur-md border border-slate-700/50 no-scrollbar">
        
        {/* 🔥 TACTICAL ZOOM HUD */}
        <div className="sticky top-2 right-2 float-right z-50 flex flex-col gap-2 bg-slate-950/80 backdrop-blur-md p-2 rounded-xl border border-slate-800 shadow-[0_0_15px_rgba(0,0,0,0.5)] mr-2">
            <button onClick={handleZoomIn} className="text-slate-400 hover:text-indigo-400 active:scale-95 transition-all">
                <ZoomIn size={18} />
            </button>
            <div className="w-full h-[1px] bg-slate-800"></div>
            <button onClick={handleZoomReset} className="text-slate-400 hover:text-indigo-400 active:scale-95 transition-all">
                <LocateFixed size={18} />
            </button>
            <div className="w-full h-[1px] bg-slate-800"></div>
            <button onClick={handleZoomOut} className="text-slate-400 hover:text-indigo-400 active:scale-95 transition-all">
                <ZoomOut size={18} />
            </button>
        </div>

        {/* 🔥 SMART SCALING WRAPPER */}
        <div className="relative origin-top-left transition-transform duration-300" style={{ transform: `scale(${zoomLevel})`, width: `${750 * zoomLevel}px`, height: `${750 * zoomLevel}px` }}>
            <div className="board-grid absolute top-0 left-0 w-[750px] h-[750px] p-3">
            {(localBoard || []).map((tile: any, index: number) => {
                const r = Math.floor(index / BOARD_SIZE);
                const c = index % BOARD_SIZE;
                const isTargeted = targetSquare === index;
                const type = getSquareType(r, c);
                
                return (
                <div key={index} onClick={() => handleBoardClick(index)} className={`w-full h-full aspect-square relative flex items-center justify-center transition-all rounded-md ${getSquareClasses(r, c, tile, isTargeted)}`}>
                    {!tile && type === 'CT' && <Star className="text-indigo-400 opacity-30 w-8 h-8" fill="currentColor" />}
                    {!tile && type === 'DP' && <FastForward className="text-fuchsia-400 opacity-50 w-6 h-6 animate-pulse" fill="currentColor" />}
                    
                    {/* ORBITAL RETICLE */}
                    {isTargeted && !tile && isMyTurn && (
                        <div className="absolute top-1/2 left-1/2 w-0 h-0 z-[100]" style={{ transform: `scale(${1/zoomLevel})` }}>
                            {rack.map((rackTile: any, rackIdx: number) => {
                                if (!rackTile) return null;
                                const angle = (rackIdx / 7) * Math.PI * 2 - (Math.PI / 2);
                                const radius = 90; 
                                const x = Math.cos(angle) * radius;
                                const y = Math.sin(angle) * radius;
                                return (
                                    <div
                                        key={`orbit_${rackIdx}`}
                                        onClick={(e) => { e.stopPropagation(); handleRackClick(rackIdx); }}
                                        className="absolute w-12 h-12 -ml-6 -mt-6 transition-all duration-300 animate-in zoom-in spin-in"
                                        style={{ transform: `translate(${x}px, ${y}px)` }}
                                    >
                                        <DataTile tile={rackTile} className="w-full h-full shadow-[0_10px_30px_rgba(0,0,0,0.8)]" />
                                    </div>
                                )
                            })}
                        </div>
                    )}
                    
                    {tile && <DataTile tile={tile} isLocked={tile.isLocked} className="w-[90%] h-[90%]" />}
                </div>
                );
            })}
            </div>
        </div>
      </div>

      <div className="relative z-10 mt-3 bg-slate-900/80 backdrop-blur-xl rounded-2xl p-3 border border-slate-700 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] w-full ring-1 ring-white/5">
         
         {invalidWords.length > 0 && (
             <div className="bg-rose-500/90 text-white px-3 py-2 rounded-lg mb-2 flex items-center gap-2 text-xs font-bold shadow-sm animate-in slide-in-from-bottom-2">
                 <AlertTriangle size={14} /> Sequence Invalid: {invalidWords.join(', ')}
             </div>
         )}

         <div className="flex justify-between items-end mb-3 px-2">
             <p className={`text-[9px] font-black uppercase tracking-widest ${isMyTurn ? 'text-indigo-400 animate-pulse' : 'text-slate-500'}`}>
                {isMyTurn ? (targetSquare === null ? 'Select orbital coordinate' : 'Tap Astro-Tile to deploy') : 'Sort your tiles'}
             </p>
             <div className="flex gap-2">
                 <button 
                     onClick={handlePurge} 
                     disabled={!isMyTurn || isValidating || (scores[myTeamId] || 0) < 10}
                     title="Purge Hand (-10 XP)"
                     className="p-1.5 bg-rose-500/20 text-rose-400 hover:text-white hover:bg-rose-500/40 rounded-lg active:scale-95 transition-colors border border-rose-500/30 shadow-sm disabled:opacity-30 disabled:hover:bg-rose-500/20 disabled:hover:text-rose-400"
                 >
                     <RefreshCw size={14} />
                 </button>
                 <button onClick={shuffleRack} className="p-1.5 bg-slate-950 text-slate-400 hover:text-white rounded-lg active:scale-95 transition-colors border border-slate-800 shadow-sm">
                     <Shuffle size={14} />
                 </button>
             </div>
         </div>

         <div className="flex gap-2 bg-black/60 p-2.5 rounded-xl w-full justify-center min-h-[4rem] border border-slate-800/80 shadow-inner">
            {rack.map((tile: any, idx: number) => {
              const isRackSelected = selectedRackIndex === idx;
              return (
                <div 
                  key={idx} 
                  onClick={() => handleRackClick(idx)} 
                  className={`w-10 h-10 rounded-lg transition-all ${!tile ? 'bg-white/5 border border-white/5' : ''} ${isRackSelected ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-black scale-105' : ''}`}
                >
                   {tile && <DataTile tile={tile} className="w-full h-full" />}
                </div>
              );
            })}
         </div>
      </div>

      <div className="relative z-10 flex gap-2 mt-3 pb-2">
         <button onClick={recallAll} disabled={isValidating} className="flex-1 py-3.5 bg-slate-900/80 text-slate-300 rounded-xl font-black uppercase tracking-widest text-xs flex justify-center items-center gap-2 active:scale-95 transition-colors hover:bg-slate-800 border border-slate-700 disabled:opacity-50">
             <ArrowDownToLine size={16}/> Recall
         </button>
         
         {isMyTurn ? (
             <button onClick={handleInitiateCommit} disabled={isValidating} className="flex-1 py-3.5 bg-indigo-600/20 text-indigo-300 hover:text-white rounded-xl font-black uppercase tracking-widest text-xs flex justify-center items-center gap-2 shadow-lg active:scale-95 border border-indigo-500/50 transition-colors hover:bg-indigo-600/40 disabled:opacity-50">
                 {isValidating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16}/>} 
                 {isValidating ? 'Validating...' : 'Play Sequence'}
             </button>
         ) : (
             <div className="flex-1 py-3.5 bg-slate-950/80 text-slate-600 rounded-xl font-black uppercase tracking-widest text-xs flex justify-center items-center gap-2 border border-slate-800/50">
                 Standby...
             </div>
         )}
      </div>
    </div>
  );
}
