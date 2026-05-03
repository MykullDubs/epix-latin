import React, { useState, useEffect } from 'react';
import { Trophy, Clock, CheckCircle2, ShieldAlert, FastForward, ArrowDownToLine, Star } from 'lucide-react';

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
  // Fisher-Yates Shuffle
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
};

// ==========================================
// MARBLE TILE UI COMPONENT
// ==========================================
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

// ==========================================
// MAIN MAGISTER OS COMPONENT
// ==========================================
export default function MarbleScrabble({ block, isProjector, liveState, studentId, onUpdateLiveState }: any) {
  const teams = block?.teams || [];
  const timeLimit = block?.timePerTurnSeconds || 60;

  // Global Styles Injection
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

  // 1. INSTRUCTOR INIT
  useEffect(() => {
    if (isProjector && !liveState?.gameStatus) {
      onUpdateLiveState({
        gameStatus: 'lobby', 
        board: Array(BOARD_SIZE * BOARD_SIZE).fill(null),
        bag: createInitialBag(),
        scores: Object.fromEntries(teams.map((t: any) => [t.id, 0])),
        rosters: {}, 
        activeTeamIndex: 0,
        turnEndTime: null,
      });
    }
  }, [isProjector, liveState]);

  // Global State sync
  const { gameStatus, board: globalBoard, bag: globalBag, scores, rosters, activeTeamIndex, turnEndTime } = liveState || {};
  const activeTeam = teams[activeTeamIndex] || teams[0];
  const myTeamId = rosters?.[studentId];
  const isMyTurn = myTeamId === activeTeam?.id && gameStatus === 'playing';

  // Timer logic
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

  // Sync local board when global board updates
  useEffect(() => {
    if (globalBoard) {
      setLocalBoard(globalBoard);
      setTargetSquare(null);
    }
  }, [globalBoard]);

  // Fill rack initially for students
  useEffect(() => {
    if (!isProjector && isMyTurn && rack.every((t: any) => t === null) && globalBag?.length > 0) {
      drawTiles();
    }
  }, [isMyTurn]);

  const drawTiles = () => {
    if (!globalBag || globalBag.length === 0) return;
    let newBag = [...globalBag];
    const newRack = rack.map((slot: any) => {
      if (slot === null && newBag.length > 0) return newBag.pop();
      return slot;
    });
    setRack(newRack);
    onUpdateLiveState({ bag: newBag });
  };

  // 🔥 NEW: Target-First Board Click Logic
  const handleBoardClick = (index: number) => {
    if (localBoard[index]?.isLocked) return; 
    
    // If the square has one of OUR placed tiles, tapping it recalls it to the rack
    if (localBoard[index] && !localBoard[index].isLocked) {
      const emptyRackIndex = rack.findIndex((t: any) => t === null);
      if (emptyRackIndex !== -1) {
        const newRack = [...rack];
        const newBoard = [...localBoard];
        newRack[emptyRackIndex] = newBoard[index];
        newBoard[index] = null;
        setRack(newRack);
        setLocalBoard(newBoard);
        setTargetSquare(index); // Leave reticle there
      }
      return;
    }

    // Move the targeting reticle to the empty square
    setTargetSquare(index);
  };

  // 🔥 NEW: Fire-to-Target Rack Click Logic
  const handleRackClick = (idx: number) => {
    if (!rack[idx]) return;

    if (targetSquare !== null && !localBoard[targetSquare]) {
      const newBoard = [...localBoard];
      const newRack = [...rack];
      
      newBoard[targetSquare] = { ...newRack[idx], isLocked: false };
      newRack[idx] = null;
      
      setLocalBoard(newBoard);
      setRack(newRack);

      // Auto-advance the reticle one square to the right
      const nextSquare = targetSquare + 1;
      if (targetSquare % BOARD_SIZE !== BOARD_SIZE - 1 && !newBoard[nextSquare]) {
         setTargetSquare(nextSquare);
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
  };

  // ==========================================
  // GAMEPLAY ACTIONS (FIREBASE SYNC)
  // ==========================================
  const joinTeam = (teamId: string) => {
    onUpdateLiveState({ 
        rosters: { ...(liveState?.rosters || {}), [studentId]: teamId } 
    });
  };

  const startGame = () => {
    onUpdateLiveState({
      gameStatus: 'playing',
      turnEndTime: Date.now() + timeLimit * 1000
    });
  };

  const passTurn = () => {
    onUpdateLiveState({
      activeTeamIndex: (activeTeamIndex + 1) % teams.length,
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

    onUpdateLiveState({
      board: lockedBoard,
      scores: { ...(liveState?.scores || {}), [myTeamId]: (scores[myTeamId] || 0) + turnScore },
      activeTeamIndex: (activeTeamIndex + 1) % teams.length,
      turnEndTime: Date.now() + timeLimit * 1000
    });
  };

  // ==========================================
  // RENDER: PROJECTOR VIEW
  // ==========================================
  if (isProjector) {
    if (gameStatus === 'lobby') {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-12 wood-bg text-white">
          <h1 className="text-[8vh] font-bold playfair-font text-amber-400 mb-12">Join Your Team</h1>
          <div className="flex gap-8 mb-16">
            {teams.map((t: any) => {
              const membersCount = Object.values(rosters || {}).filter((id: any) => id === t.id).length;
              return (
                <div key={t.id} className={`${t.color} p-8 rounded-3xl text-center min-w-[250px] shadow-2xl border-4 border-white/20`}>
                  <h2 className="text-3xl font-black mb-4">{t.name}</h2>
                  <p className="text-6xl font-bold">{membersCount}</p>
                  <p className="text-white/70 uppercase tracking-widest mt-2">Players</p>
                </div>
              );
            })}
          </div>
          <button onClick={startGame} className="px-16 py-6 bg-amber-500 hover:bg-amber-400 text-amber-950 rounded-full font-black text-2xl uppercase tracking-widest shadow-[0_0_40px_rgba(245,158,11,0.5)] transition-transform active:scale-95">
            Begin Battle
          </button>
        </div>
      );
    }

    return (
      <div className="w-full h-full flex p-12 wood-bg text-white gap-12 overflow-hidden">
        {/* Board Area */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className={`mb-8 px-12 py-4 rounded-full border-4 shadow-[0_0_30px_rgba(0,0,0,0.5)] ${activeTeam?.color} border-white/20 animate-in slide-in-from-top-10`}>
             <h2 className="text-4xl font-black uppercase tracking-widest flex items-center gap-4">
                {activeTeam?.name}'s Turn <Clock className="ml-4" /> {timeLeft}s
             </h2>
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

        {/* Sidebar */}
        <div className="w-[400px] flex flex-col gap-6 pt-24">
          <div className="bg-slate-800/80 backdrop-blur-md p-8 rounded-3xl border border-slate-700/50 shadow-xl">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-700">
              <h2 className="text-2xl font-bold flex items-center gap-3"><Trophy className="text-amber-400"/> Scores</h2>
              <span className="text-slate-400 font-mono text-sm">{globalBag?.length || 0} tiles in bag</span>
            </div>
            <div className="space-y-4">
              {teams.map((t: any) => (
                <div key={t.id} className={`flex justify-between items-center p-4 rounded-2xl border-2 transition-colors ${activeTeamIndex === teams.indexOf(t) ? 'border-white bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'border-transparent bg-slate-900/50'}`}>
                  <span className={`font-bold text-xl ${t.textColor}`}>{t.name}</span>
                  <span className="text-3xl font-black">{scores?.[t.id] || 0}</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={passTurn} className="py-4 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white rounded-2xl font-bold flex justify-center items-center gap-2 transition-colors border border-rose-500/30">
            <FastForward size={20}/> Force Skip Turn
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: STUDENT VIEW (Mobile)
  // ==========================================
  if (gameStatus === 'lobby') {
    return (
      <div className="flex flex-col h-full w-full wood-bg p-6 justify-center items-center text-center">
        <h2 className="text-4xl font-bold text-amber-100 playfair-font mb-12">Select Allegiance</h2>
        <div className="flex flex-col gap-6 w-full max-w-sm">
          {teams.map((t: any) => (
            <button 
              key={t.id} 
              onClick={() => joinTeam(t.id)}
              className={`p-6 rounded-2xl font-black text-2xl uppercase tracking-widest transition-all ${myTeamId === t.id ? 'ring-4 ring-white scale-105 shadow-[0_0_30px_rgba(255,255,255,0.3)]' : 'opacity-80 hover:opacity-100'} ${t.color} text-white`}
            >
              {t.name}
            </button>
          ))}
        </div>
        {myTeamId && <p className="mt-12 text-amber-200/50 font-bold animate-pulse">Awaiting Game Master...</p>}
      </div>
    );
  }

  if (!isMyTurn) {
    return (
      <div className="flex flex-col h-full w-full wood-bg p-6 justify-center items-center text-center">
        <ShieldAlert size={80} className={`${activeTeam?.textColor} mb-8 opacity-50`} />
        <h2 className={`text-3xl font-black uppercase tracking-widest ${activeTeam?.textColor} mb-2`}>{activeTeam?.name}'s Turn</h2>
        <p className="text-lg font-bold text-slate-400 mb-12">Discuss strategy. Wait for your turn.</p>
        <div className="text-8xl font-mono font-black text-amber-100/80">{timeLeft}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full wood-bg p-2 overflow-hidden border-4 border-emerald-500/50">
      <div className="flex justify-between items-center mb-2 bg-emerald-900/60 p-3 rounded-xl border border-emerald-500/50">
         <span className="text-emerald-100 font-black uppercase tracking-widest animate-pulse flex items-center gap-2 text-sm">
            <Clock size={16} /> {timeLeft}s Left
         </span>
         <span className="text-amber-400 font-bold playfair-font">Your Turn</span>
      </div>

      {/* Mini Board (Scrollable Viewport) */}
      <div className="flex-1 overflow-auto rounded-xl shadow-inner bg-[#d0c8b6] border-4 border-[#8b7355] relative no-scrollbar">
        {/* FORCE MINIMUM WIDTH SO SQUARES ARE MASSIVE ON MOBILE */}
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
              <div 
                key={index} 
                onClick={() => handleBoardClick(index)}
                className={`w-full h-full aspect-square border border-[#c4bcab] ${bgClass} shadow-inner flex items-center justify-center relative transition-all ${isTargeted ? 'ring-4 ring-inset ring-amber-400 z-20 bg-amber-100/50' : ''}`}
              >
                {!tile && type === 'CT' && <Star className="text-amber-100 opacity-70 w-8 h-8" fill="currentColor" />}
                
                {/* The Glowing Reticle Overlay */}
                {isTargeted && !tile && (
                    <div className="absolute inset-0 m-2 border-2 border-dashed border-amber-500 rounded-md animate-pulse" />
                )}

                {tile && (
                  <MarbleTile 
                    tile={tile} 
                    isLocked={tile.isLocked} 
                    className="w-[90%] h-[90%]" 
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Rack Area */}
      <div className="mt-2 bg-[#8b7355] rounded-xl p-2 border-b-4 border-[#5c4a35] w-full z-10 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
         {/* Instructional Text */}
         {targetSquare === null ? (
            <p className="text-center text-amber-200/50 text-[10px] font-black uppercase tracking-widest mb-2 animate-pulse">
                Tap board to target square
            </p>
         ) : (
            <p className="text-center text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-2">
                Tap letter to deploy
            </p>
         )}

         <div className="flex gap-1 bg-[#4a3b29] p-2 rounded-lg w-full justify-center min-h-[3.5rem]">
            {rack.map((tile: any, idx: number) => (
              <div 
                key={idx} 
                onClick={() => handleRackClick(idx)}
                className={`w-10 h-10 rounded-md transition-all ${!tile ? 'bg-black/20' : ''}`}
              >
                 {tile && <MarbleTile tile={tile} className="w-full h-full" />}
              </div>
            ))}
         </div>
      </div>

      {/* Action Controls */}
      <div className="flex gap-2 mt-2 pb-2">
         <button onClick={recallAll} className="flex-1 py-3 bg-slate-700 text-white rounded-xl font-bold flex justify-center items-center gap-2 active:scale-95"><ArrowDownToLine size={18}/> Recall</button>
         <button onClick={commitTurn} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg active:scale-95 border-b-4 border-emerald-800"><CheckCircle2 size={18}/> Play Word</button>
      </div>
    </div>
  );
}
