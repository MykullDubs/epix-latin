import React, { useState, useEffect } from 'react';
import { Trophy, Clock, CheckCircle2, ShieldAlert, FastForward, ArrowDownToLine, Star, Users, UserPlus, PenTool, User } from 'lucide-react';

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
  const timeLimit = block?.timePerTurnSeconds || 60;

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
  const activeTeamIndex = liveState?.activeTeamIndex || 0;
  const turnEndTime = liveState?.turnEndTime;
  
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

  const [localBoard, setLocalBoard] = useState(globalBoard || Array(BOARD_SIZE * BOARD_SIZE).fill(null));
  const [rack, setRack] = useState<any[]>(Array(7).fill(null));
  const [targetSquare, setTargetSquare] = useState<number | null>(null);
  const [lastPlacedIndex, setLastPlacedIndex] = useState<number | null>(null);
  const [playDirection, setPlayDirection] = useState<number | null>(null);

  useEffect(() => {
    if (globalBoard) {
      setLocalBoard(globalBoard);
      setTargetSquare(null);
      setLastPlacedIndex(null);
      setPlayDirection(null);
    }
  }, [globalBoard]);

  useEffect(() => {
    if (!isProjector && isMyTurn && rack.some((t: any) => t === null) && globalBag?.length > 0) {
      drawTiles();
    }
  }, [isMyTurn]);

  const drawTiles = () => {
    if (!globalBag || globalBag.length === 0) return;
    let newBag = [...globalBag];
    let changed = false;
    const newRack = rack.map((slot: any) => {
      if (slot === null && newBag.length > 0) {
        changed = true;
        return newBag.pop();
      }
      return slot;
    });
    
    if (changed) {
      setRack(newRack);
      onUpdateLiveState({ bag: newBag });
    }
  };

  const handleBoardClick = (index: number) => {
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
    if (!rack[idx]) return;
    if (targetSquare !== null && !localBoard[targetSquare]) {
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
  };

  const recallAll = () => {
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
  };

  // 🔥 NEW: MATCHMAKING ACTIONS
  const joinLobby = () => {
    const displayName = studentId.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ');
    const newPlayers = { 
        ...players, 
        [studentId]: { id: studentId, name: displayName.charAt(0).toUpperCase() + displayName.slice(1) } 
    };
    onUpdateLiveState({ players: newPlayers });
  };

  // 🔥 UPDATED: Dynamic Free-For-All Matchmaking
  const initializeFFA = () => {
    const playerIds = Object.keys(players);
    const newTeams: any = {};
    const newScores: any = {};

    playerIds.forEach((pId, idx) => {
        const tId = `p_${idx}`;
        newTeams[tId] = {
            id: tId,
            order: idx,
            name: players[pId].name, // Default to their name
            color: INDIVIDUAL_COLORS[idx % INDIVIDUAL_COLORS.length].color,
            textColor: INDIVIDUAL_COLORS[idx % INDIVIDUAL_COLORS.length].textColor,
            members: [pId] // One player per "team"
        };
        newScores[tId] = 0;
    });

    onUpdateLiveState({
        gameStatus: 'lobby_naming',
        teams: newTeams,
        scores: newScores
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
    onUpdateLiveState({
      gameStatus: 'playing',
      turnEndTime: Date.now() + timeLimit * 1000
    });
  };

  const passTurn = () => {
    if (teamArray.length === 0) return;
    onUpdateLiveState({
      activeTeamIndex: (activeTeamIndex + 1) % teamArray.length,
      turnEndTime: Date.now() + timeLimit * 1000
    });
  };

  const commitTurn = () => {
    let turnScore = 0;
    localBoard.forEach((tile: any, idx: number) => {
      if (tile && !tile.isLocked) {
        turnScore += tile.value;
      }
    });
    if (turnScore === 0) return; 

    const lockedBoard = localBoard.map((t: any) => t && !t.isLocked ? { ...t, isLocked: true } : t);
    const updatedScores = { ...scores, [myTeamId]: (scores[myTeamId] || 0) + turnScore };

    onUpdateLiveState({
      board: lockedBoard,
      scores: updatedScores,
      activeTeamIndex: teamArray.length > 1 ? (activeTeamIndex + 1) % teamArray.length : 0,
      turnEndTime: Date.now() + timeLimit * 1000
    });
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
          <div className="flex items-center gap-4 text-4xl font-black mb-16 text-slate-300">
             <Users size={48} className="text-emerald-400 animate-pulse" /> {joinedCount} {joinedCount === 1 ? 'Player' : 'Players'} in Lobby
          </div>
          <button 
             disabled={joinedCount < 1}
             onClick={initializeFFA}
             className="px-12 py-8 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-[2.5rem] font-black text-3xl shadow-[0_20px_50px_rgba(79,70,229,0.4)] transition-all border-4 border-indigo-400 active:scale-95 flex items-center gap-4"
          >
             Initialize Individual Duel <FastForward size={32} />
          </button>
          <p className="mt-8 text-slate-500 font-bold uppercase tracking-widest text-sm">Supports 1 to 6 Individual Profiles</p>
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
          <div className="bg-slate-800/80 backdrop-blur-md p-8 rounded-3xl border border-slate-700/50 shadow-xl">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-700">
              <h2 className="text-2xl font-bold flex items-center gap-3"><Trophy className="text-amber-400"/> Scores</h2>
              <span className="text-slate-400 font-mono text-sm">{globalBag?.length || 0} tiles left</span>
            </div>
            <div className="space-y-4">
              {teamArray.map((t: any) => (
                <div key={t.id} className={`flex justify-between items-center p-4 rounded-2xl border-2 transition-colors ${activeTeamIndex === t.order ? 'border-white bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'border-transparent bg-slate-900/50'}`}>
                  <span className={`font-bold text-xl ${t.textColor}`}>{t.name}</span>
                  <span className="text-3xl font-black">{scores?.[t.id] || 0}</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={passTurn} className="py-4 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white rounded-2xl font-bold flex justify-center items-center gap-2 transition-colors border border-rose-500/30">
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

  if (!isMyTurn) {
    return (
      <div className="flex flex-col h-full w-full wood-bg p-6 justify-center items-center text-center">
        <ShieldAlert size={80} className={`${activeTeam?.textColor || 'text-slate-400'} mb-8 opacity-50`} />
        <h2 className={`text-3xl font-black uppercase tracking-widest ${activeTeam?.textColor || 'text-slate-400'} mb-2`}>{activeTeam?.name || 'Unknown'}'s Turn</h2>
        <p className="text-lg font-bold text-slate-400 mb-8 italic">Plotting next move...</p>
        <div className="mt-8 flex items-center gap-3 bg-slate-900/50 backdrop-blur-md px-6 py-3 rounded-full border border-slate-700 shadow-inner">
            <Clock className="text-amber-500 w-5 h-5" />
            <span className="text-3xl font-mono font-bold text-amber-100">{timeLeft}s</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full wood-bg p-2 overflow-hidden border-4 border-emerald-500/50">
      <div className="flex justify-between items-center mb-2 bg-emerald-900/60 p-3 rounded-xl border border-emerald-500/50">
         <span className="text-emerald-100 font-black uppercase tracking-widest animate-pulse flex items-center gap-2 text-sm">
            <Clock size={16} /> {timeLeft}s Left
         </span>
         <span className="text-amber-400 font-bold playfair-font truncate ml-4 max-w-[120px] text-right">{myTeamEntry?.name}</span>
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
         {targetSquare === null ? (
            <p className="text-center text-amber-200/50 text-[10px] font-black uppercase tracking-widest mb-2 animate-pulse">Tap board to target square</p>
         ) : (
            <p className="text-center text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-2">Tap letter to deploy</p>
         )}
         <div className="flex gap-1 bg-[#4a3b29] p-2 rounded-lg w-full justify-center min-h-[3.5rem]">
            {rack.map((tile: any, idx: number) => (
              <div key={idx} onClick={() => handleRackClick(idx)} className={`w-10 h-10 rounded-md transition-all ${!tile ? 'bg-black/20' : ''}`}>
                 {tile && <MarbleTile tile={tile} className="w-full h-full" />}
              </div>
            ))}
         </div>
      </div>
      <div className="flex gap-2 mt-2 pb-2">
         <button onClick={recallAll} className="flex-1 py-3 bg-slate-700 text-white rounded-xl font-bold flex justify-center items-center gap-2 active:scale-95"><ArrowDownToLine size={18}/> Recall</button>
         <button onClick={commitTurn} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg active:scale-95 border-b-4 border-emerald-800"><CheckCircle2 size={18}/> Play Word</button>
      </div>
    </div>
  );
}
