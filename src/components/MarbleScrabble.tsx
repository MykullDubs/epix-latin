import React, { useState, useEffect } from 'react';
import {
  Trophy, Clock, CheckCircle2, FastForward, ArrowDownToLine,
  Star, Users, User, MessageSquare, Shuffle, Loader2,
  AlertTriangle, Rocket, RefreshCw, ZoomIn, ZoomOut,
  LocateFixed, Pause, Play, Power, ShieldAlert, BookOpen, Layers
} from 'lucide-react';

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const BOARD_SIZE = 15;

const TIERS: Record<number, { label: string; color: string; bg: string; border: string; points: number }> = {
  1: { label: 'A1 — Basic',    color: '#16a34a', bg: 'rgba(22,163,74,0.12)',    border: 'rgba(22,163,74,0.35)',   points: 1 },
  2: { label: 'A2 — Elementary', color: '#2563eb', bg: 'rgba(37,99,235,0.12)', border: 'rgba(37,99,235,0.35)',   points: 1.5 },
  3: { label: 'B1 — Intermediate', color: '#7c3aed', bg: 'rgba(124,58,237,0.12)', border: 'rgba(124,58,237,0.35)', points: 2 },
  4: { label: 'B2 — Upper Int.', color: '#c2410c', bg: 'rgba(194,65,12,0.12)',  border: 'rgba(194,65,12,0.35)',   points: 2.5 },
  5: { label: 'C1 — Advanced',  color: '#9f1239', bg: 'rgba(159,18,57,0.12)',   border: 'rgba(159,18,57,0.35)',   points: 3 },
};

function assignTier(word: string, rawLetterSum: number): number {
  const len = word.length;
  const avg = rawLetterSum / len;
  if (len <= 3 && avg < 3) return 1;
  if (len <= 4 && avg < 4) return 2;
  if (len <= 6 && avg < 5) return 3;
  if (len <= 8 && avg < 7) return 4;
  return 5;
}

const LETTER_DATA: Record<string, { count: number; value: number }> = {
  A:{count:9,value:1}, B:{count:2,value:3}, C:{count:2,value:3},
  D:{count:4,value:2}, E:{count:12,value:1}, F:{count:2,value:4},
  G:{count:3,value:2}, H:{count:2,value:4}, I:{count:9,value:1},
  J:{count:1,value:8}, K:{count:1,value:5}, L:{count:4,value:1},
  M:{count:2,value:3}, N:{count:6,value:1}, O:{count:8,value:1},
  P:{count:2,value:3}, Q:{count:1,value:10}, R:{count:6,value:1},
  S:{count:4,value:1}, T:{count:6,value:1}, U:{count:4,value:1},
  V:{count:2,value:4}, W:{count:2,value:4}, X:{count:1,value:8},
  Y:{count:2,value:4}, Z:{count:1,value:10}
};

const PLAYER_COLORS = [
  { bg: '#4f46e5', muted: 'rgba(79,70,229,0.15)', border: 'rgba(79,70,229,0.4)' },
  { bg: '#dc2626', muted: 'rgba(220,38,38,0.15)',  border: 'rgba(220,38,38,0.4)' },
  { bg: '#d97706', muted: 'rgba(217,119,6,0.15)',  border: 'rgba(217,119,6,0.4)' },
  { bg: '#059669', muted: 'rgba(5,150,105,0.15)',  border: 'rgba(5,150,105,0.4)' },
  { bg: '#7c3aed', muted: 'rgba(124,58,237,0.15)', border: 'rgba(124,58,237,0.4)' },
  { bg: '#0891b2', muted: 'rgba(8,145,178,0.15)',  border: 'rgba(8,145,178,0.4)' },
];

const getSquareType = (r: number, c: number) => {
  if (r === 7 && c === 7) return 'CT';
  if ((r === 0 || r === 7 || r === 14) && (c === 0 || c === 7 || c === 14) && !(r===7&&c===7)) return 'TW';
  const dwD = [1,2,3,4,10,11,12,13];
  if (r===c && dwD.includes(r)) return 'DW';
  if (14-r===c && dwD.includes(r)) return 'DW';
  const tl = [[1,5],[1,9],[5,1],[5,5],[5,9],[5,13],[9,1],[9,5],[9,9],[9,13],[13,5],[13,9]];
  if (tl.some(([tr,tc])=>tr===r&&tc===c)) return 'TL';
  const dl = [[0,3],[0,11],[2,6],[2,8],[3,0],[3,7],[3,14],[6,2],[6,6],[6,8],[6,12],[7,3],[7,11],[8,2],[8,6],[8,8],[8,12],[11,0],[11,7],[11,14],[12,6],[12,8],[14,3],[14,11]];
  if (dl.some(([tr,tc])=>tr===r&&tc===c)) return 'DL';
  const dpPoints = [[1,7], [7,1], [7,13], [13,7]];
  if (dpPoints.some(([tr, tc]) => tr === r && tc === c)) return 'DP';
  return null;
};

const createBag = () => {
  let bag: any[] = [];
  let id = 0;
  Object.entries(LETTER_DATA).forEach(([letter, d]) => {
    for (let i = 0; i < d.count; i++) bag.push({ id: `t${id++}`, letter, value: d.value });
  });
  for (let i = bag.length-1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [bag[i],bag[j]] = [bag[j],bag[i]];
  }
  return bag;
};

// ─────────────────────────────────────────────
// 3D TILE COMPONENT (With isSolid Readability Prop)
// ─────────────────────────────────────────────
const Tile = ({ tile, selected, locked, onClick, size = 'md', isBoardTile = false, isSolid = false }: any) => {
  if (!tile) return null;
  const sz = size === 'sm' ? 'w-8 h-8 text-sm' : size === 'lg' ? 'w-14 h-14 text-xl' : 'w-10 h-10 text-base';
  
  const zDepth = isBoardTile ? (selected ? 'translateZ(25px) scale(1.1)' : 'translateZ(10px)') : (selected ? 'translateY(-3px) scale(1.08)' : 'none');
  
  // 🔥 Conditional rendering for Solid vs Glass
  const defaultBg = isSolid ? '#0f172a' : 'rgba(255,255,255,0.06)';
  const defaultBorder = isSolid ? '1px solid rgba(148, 163, 184, 0.3)' : '1px solid rgba(255,255,255,0.12)';
  const selectedBg = isSolid ? '#78350f' : 'rgba(245,208,90,0.2)'; 
  const selectedBorder = isSolid ? '1.5px solid #f59e0b' : '1.5px solid rgba(245,208,90,0.7)';

  return (
    <div
      onClick={!locked ? onClick : undefined}
      style={{
        background: selected ? selectedBg : defaultBg,
        border: selected ? selectedBorder : defaultBorder,
        boxShadow: selected ? '0 0 20px rgba(245,208,90,0.3)' : (isSolid ? '0 6px 12px rgba(0,0,0,0.8)' : '0 4px 12px rgba(0,0,0,0.5)'),
        transform: zDepth,
        transformStyle: 'preserve-3d',
        cursor: locked ? 'default' : 'pointer',
        fontFamily: "'DM Serif Display', serif",
      }}
      className={`${sz} relative flex items-center justify-center rounded-lg transition-all duration-300 select-none ${!isSolid ? 'backdrop-blur-md' : ''}`}
    >
      <span style={{ color: locked ? 'rgba(255,255,255,0.7)' : (isSolid ? '#ffffff' : '#f8fafc'), fontWeight: 700, lineHeight: 1, textShadow: isSolid ? 'none' : '0 2px 4px rgba(0,0,0,0.5)' }}>
        {tile.letter}
      </span>
      <span style={{
        position: 'absolute', bottom: 1, right: 2,
        fontSize: 8, fontWeight: 700, color: '#f59e0b',
        fontFamily: 'monospace', lineHeight: 1,
        textShadow: isSolid ? 'none' : '0 1px 2px rgba(0,0,0,0.8)'
      }}>{tile.value}</span>
    </div>
  );
};

// ─────────────────────────────────────────────
// WORD DISCOVERY CARD
// ─────────────────────────────────────────────
const WordCard = ({ entry }: any) => {
  const tier = TIERS[entry.tier] || TIERS[2];
  return (
    <div style={{
      background: tier.bg, border: `1px solid ${tier.border}`,
      borderRadius: 12, padding: '10px 14px', marginBottom: 8, position: 'relative', overflow: 'hidden'
    }}>
      {entry.isStanza && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#d946ef' }} />
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: '#f8fafc', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
          {entry.word}
          {entry.isStanza && (
            <span title="Stanza Stack" style={{ display: 'flex', alignItems: 'center' }}>
                <Layers size={14} style={{ color: '#d946ef' }} />
            </span>
          )}
        </span>
        <span style={{
          fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1,
          color: tier.color, background: `${tier.bg}`, border: `1px solid ${tier.border}`,
          borderRadius: 6, padding: '2px 7px'
        }}>{tier.label}</span>
      </div>
      {entry.phonetic && (
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 3 }}>
          /{entry.phonetic}/
        </span>
      )}
      {entry.pos && (
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontStyle: 'italic', display: 'block', marginBottom: 3 }}>
          {entry.pos}
        </span>
      )}
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5, margin: 0 }}>
        {entry.def}
      </p>
    </div>
  );
};

// ─────────────────────────────────────────────
// JOURNAL PANEL (student's personal word log)
// ─────────────────────────────────────────────
const JournalPanel = ({ words, onClose }: any) => {
  const byTier = [5,4,3,2,1].map(t => ({
    tier: t,
    entries: words.filter((w: any) => w.tier === t)
  })).filter(g => g.entries.length > 0);

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: 'rgba(8,10,20,0.97)', overflowY: 'auto',
      borderRadius: 16, padding: 20
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: '#f8fafc' }}>
          Word Journal
        </span>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8, color: 'rgba(255,255,255,0.6)', padding: '4px 12px', cursor: 'pointer', fontSize: 12
        }}>Close</button>
      </div>
      {words.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
          No words yet. Play some tiles!
        </p>
      ) : byTier.map(({ tier, entries }) => (
        <div key={tier} style={{ marginBottom: 20 }}>
          <div style={{
            fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5,
            color: TIERS[tier].color, marginBottom: 8
          }}>{TIERS[tier].label} — {entries.length} word{entries.length !== 1 ? 's' : ''}</div>
          {entries.map((e: any, i: number) => <WordCard key={i} entry={e} />)}
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────
// SQUARE STYLES
// ─────────────────────────────────────────────
const squareStyle = (r: number, c: number, targeted: boolean) => {
  const type = getSquareType(r, c);
  let bg = 'rgba(255,255,255,0.03)', border = 'rgba(255,255,255,0.07)';
  if (type === 'TW') { bg = 'rgba(220,38,38,0.18)'; border = 'rgba(220,38,38,0.4)'; }
  else if (type === 'DW') { bg = 'rgba(217,119,6,0.18)'; border = 'rgba(217,119,6,0.4)'; }
  else if (type === 'TL') { bg = 'rgba(8,145,178,0.18)'; border = 'rgba(8,145,178,0.4)'; }
  else if (type === 'DL') { bg = 'rgba(5,150,105,0.18)'; border = 'rgba(5,150,105,0.4)'; }
  else if (type === 'CT') { bg = 'rgba(79,70,229,0.2)'; border = 'rgba(79,70,229,0.45)'; }
  else if (type === 'DP') { bg = 'rgba(217,70,239,0.18)'; border = 'rgba(217,70,239,0.4)'; }

  if (targeted) { bg = 'rgba(245,208,90,0.15)'; border = 'rgba(245,208,90,0.6)'; }
  return { background: bg, border: `1px solid ${border}`, borderRadius: 4, transformStyle: 'preserve-3d' as 'preserve-3d' };
};

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function WordForge({ block, isProjector, liveState, studentId, onUpdateLiveState }: any) {
  const timeLimit = liveState?.timeLimit || block?.timePerTurnSeconds || 90;
  const [selectedTime, setSelectedTime] = useState(90);

  useEffect(() => {
    if (!document.getElementById('wf-fonts')) {
      const s = document.createElement('style');
      s.id = 'wf-fonts';
      s.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600&display=swap');
        .wf-root { font-family: 'DM Sans', sans-serif; }
        .wf-board { display: grid; grid-template-columns: repeat(${BOARD_SIZE}, 1fr); gap: 2px; }
        .wf-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
        .wf-scroll::-webkit-scrollbar-track { background: transparent; }
        .wf-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      `;
      document.head.appendChild(s);
    }
  }, []);

  const gameStatus = liveState?.gameStatus;
  const players: Record<string, any> = liveState?.players || {};
  const teams: Record<string, any> = liveState?.teams || {};
  const globalBoard = liveState?.board;
  const globalBag = liveState?.bag;
  const scores: Record<string, number> = liveState?.scores || {};
  const journals: Record<string, any[]> = liveState?.journals || {};
  const latestDiscoveries: any[] = liveState?.latestDiscoveries || [];
  const latestSentence = liveState?.latestSentence;
  const activeTeamIndex = liveState?.activeTeamIndex || 0;
  const turnEndTime = liveState?.turnEndTime;
  const isTimerPaused = liveState?.isTimerPaused || false;
  const remainingPausedTime = liveState?.remainingPausedTime || 0;
  const isExtraTurn = liveState?.isExtraTurn || false;

  const teamArray = Object.values(teams).sort((a: any, b: any) => a.order - b.order);
  const activeTeam: any = teamArray[activeTeamIndex] || teamArray[0] || {};
  const myTeamEntry: any = Object.values(teams).find((t: any) => t.members?.includes(studentId));
  const myTeamId = myTeamEntry?.id;
  const isMyTurn = myTeamId === activeTeam?.id && gameStatus === 'playing';

  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    if (isTimerPaused) { setTimeLeft(remainingPausedTime); return; }
    if (!turnEndTime) return;
    const iv = setInterval(() => {
      const rem = Math.max(0, Math.floor((turnEndTime - Date.now()) / 1000));
      setTimeLeft(rem);
      if (rem === 0 && isProjector && gameStatus === 'playing') passTurn();
    }, 500);
    return () => clearInterval(iv);
  }, [turnEndTime, isProjector, gameStatus, isTimerPaused, remainingPausedTime]);

  const [localBoard, setLocalBoard] = useState<any[]>(Array(BOARD_SIZE * BOARD_SIZE).fill(null));
  const [rack, setRack] = useState<any[]>(Array(7).fill(null));
  const [targetSquare, setTargetSquare] = useState<number | null>(null);
  const [lastPlaced, setLastPlaced] = useState<number | null>(null);
  const [playDir, setPlayDir] = useState<number | null>(null);
  const [selectedRack, setSelectedRack] = useState<number | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  const [isValidating, setIsValidating] = useState(false);
  const [invalidWords, setInvalidWords] = useState<string[]>([]);
  const [pendingSentence, setPendingSentence] = useState(false);
  const [sentenceText, setSentenceText] = useState('');
  const [currentWords, setCurrentWords] = useState<any[]>([]);
  const [currentScore, setCurrentScore] = useState(0);

  const [zoom, setZoom] = useState(1);
  const [viewAngle, setViewAngle] = useState(0); 
  const [showJournal, setShowJournal] = useState(false);

  const getTransform = () => {
    if (viewAngle === 1) return 'rotateX(45deg)';
    if (viewAngle === 2) return 'rotateX(60deg) scale(0.9)';
    return 'none';
  };

  useEffect(() => {
    if (isProjector && !liveState?.gameStatus) {
      onUpdateLiveState({
        gameStatus: 'lobby_join',
        players: {}, teams: {}, board: Array(BOARD_SIZE * BOARD_SIZE).fill(null),
        bag: createBag(), scores: {}, journals: {},
        latestDiscoveries: [], activeTeamIndex: 0,
        turnEndTime: null, isTimerPaused: false, remainingPausedTime: 0, isExtraTurn: false
      });
    }
  }, [isProjector, liveState]);

  useEffect(() => {
    if (globalBoard) {
      setLocalBoard(globalBoard);
      setTargetSquare(null); setLastPlaced(null); setPlayDir(null);
      setPendingSentence(false); setSentenceText('');
      setSelectedRack(null); setInvalidWords([]); setCurrentWords([]);
    }
  }, [globalBoard]);

  useEffect(() => {
    if (!isProjector && !isMyTurn) {
      let nr = [...rack], nb = [...localBoard], changed = false;
      nb.forEach((tile, i) => {
        if (tile && !tile.isLocked) {
          const ei = nr.findIndex(t => t === null);
          if (ei !== -1) { nr[ei] = tile; nb[i] = null; changed = true; }
        }
      });
      if (changed) { setRack(nr); setLocalBoard(nb); }
      setTargetSquare(null); setLastPlaced(null); setPlayDir(null); setSelectedRack(null);
    }
  }, [isMyTurn]);

  useEffect(() => {
    if (!isProjector && isMyTurn && !hasDrawn && globalBag?.length > 0) {
      let newBag = [...globalBag];
      const newRack = rack.map((s: any) => s === null && newBag.length > 0 ? newBag.pop() : s);
      setRack(newRack); setHasDrawn(true);
      onUpdateLiveState({ bag: newBag });
    }
  }, [isMyTurn, hasDrawn, globalBag, isProjector]);

  const joinLobby = () => {
    const name = (studentId.split('@')[0].replace(/[^a-zA-Z0-9]/g,' ')).trim();
    const display = name.charAt(0).toUpperCase() + name.slice(1);
    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${studentId}&backgroundColor=transparent`;
    onUpdateLiveState({ players: { ...players, [studentId]: { id: studentId, name: display, avatar } } });
  };

  const startFFA = () => {
    const pIds = Object.keys(players);
    const newTeams: any = {}, newScores: any = {}, newJournals: any = {};
    pIds.forEach((pId, idx) => {
      const tId = `p_${idx}`;
      newTeams[tId] = {
        id: tId, order: idx, name: players[pId].name, avatar: players[pId].avatar,
        color: PLAYER_COLORS[idx % PLAYER_COLORS.length], members: [pId]
      };
      newScores[tId] = 0; newJournals[tId] = [];
    });
    onUpdateLiveState({ gameStatus: 'lobby_naming', teams: newTeams, scores: newScores, journals: newJournals, timeLimit: selectedTime });
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
      isExtraTurn: false, isTimerPaused: false
    });
  };

  const togglePause = () => {
    isTimerPaused
      ? onUpdateLiveState({ isTimerPaused: false, turnEndTime: Date.now() + remainingPausedTime * 1000 })
      : onUpdateLiveState({ isTimerPaused: true, remainingPausedTime: timeLeft });
  };

  const forceEnd = () => onUpdateLiveState({ gameStatus: 'finished' });

  const recallAll = () => {
    if (isValidating || isTimerPaused) return;
    const nr = [...rack], nb = [...localBoard];
    nb.forEach((tile, i) => {
      if (tile && !tile.isLocked) {
        const ei = nr.findIndex(t => t === null);
        if (ei !== -1) { nr[ei] = tile; nb[i] = null; }
      }
    });
    setLocalBoard(nb); setRack(nr);
    setTargetSquare(null); setLastPlaced(null); setPlayDir(null); setInvalidWords([]);
  };

  const shuffleRack = () => {
    let nr = [...rack];
    for (let i = nr.length-1; i > 0; i--) {
      const j = Math.floor(Math.random()*(i+1)); [nr[i],nr[j]] = [nr[j],nr[i]];
    }
    setRack(nr); setSelectedRack(null);
  };

  const handlePurge = () => {
    if (!isMyTurn || isValidating || isTimerPaused) return;
    if ((scores[myTeamId] || 0) < 10) return;

    let tilesToReturn: any[] = [];
    const newBoard = [...localBoard];
    newBoard.forEach((tile: any, index: number) => {
        if (tile && !tile.isLocked) {
            tilesToReturn.push(tile);
            newBoard[index] = null;
        }
    });
    rack.forEach(tile => { if (tile) tilesToReturn.push(tile); });

    let newBag = [...(globalBag || []), ...tilesToReturn];
    for (let i = newBag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newBag[i], newBag[j]] = [newBag[j], newBag[i]];
    }

    let newRack = Array(7).fill(null);
    newRack = newRack.map(() => newBag.length > 0 ? newBag.pop() : null);

    setRack(newRack); setLocalBoard(newBoard);
    setTargetSquare(null); setLastPlaced(null); setPlayDir(null);
    setInvalidWords([]); setSelectedRack(null);

    const updatedScores = { ...scores, [myTeamId]: (scores[myTeamId] || 0) - 10 };
    onUpdateLiveState({
        bag: newBag, scores: updatedScores,
        activeTeamIndex: teamArray.length > 1 ? (activeTeamIndex + 1) % teamArray.length : 0,
        turnEndTime: Date.now() + timeLimit * 1000,
        isExtraTurn: false, isTimerPaused: false
    });
  };

  const handleBoardClick = (idx: number) => {
    if (!isMyTurn || isValidating || isTimerPaused) return;
    setSelectedRack(null); setInvalidWords([]);
    if (localBoard[idx]?.isLocked) return;
    if (localBoard[idx] && !localBoard[idx].isLocked) {
      const ei = rack.findIndex(t => t === null);
      if (ei !== -1) {
        const nr = [...rack], nb = [...localBoard];
        nr[ei] = nb[idx]; nb[idx] = null;
        setRack(nr); setLocalBoard(nb);
        setTargetSquare(idx); setLastPlaced(null); setPlayDir(null);
      }
      return;
    }
    setTargetSquare(idx);
  };

  const handleRackClick = (idx: number) => {
    if (isValidating || isTimerPaused) return;
    setInvalidWords([]);
    if (targetSquare !== null) {
      if (!isMyTurn || !rack[idx]) return;
      if (!localBoard[targetSquare]) {
        const nb = [...localBoard], nr = [...rack];
        nb[targetSquare] = { ...nr[idx], isLocked: false };
        nr[idx] = null;
        setLocalBoard(nb); setRack(nr);
        let dir = playDir;
        if (lastPlaced !== null) {
          const d = targetSquare - lastPlaced;
          if (d === 1 || d === BOARD_SIZE) { dir = d; setPlayDir(d); } else { dir = null; setPlayDir(null); }
        }
        setLastPlaced(targetSquare);
        if (dir !== null) {
          const next = targetSquare + dir;
          const hv = dir === 1 && targetSquare % BOARD_SIZE !== BOARD_SIZE - 1;
          const vv = dir === BOARD_SIZE && targetSquare + BOARD_SIZE < BOARD_SIZE * BOARD_SIZE;
          if ((hv || vv) && !nb[next]) setTargetSquare(next); else setTargetSquare(null);
        } else setTargetSquare(null);
      }
      return;
    }
    if (selectedRack === null) { if (rack[idx]) setSelectedRack(idx); }
    else {
      if (selectedRack === idx) { setSelectedRack(null); }
      else {
        const nr = [...rack]; [nr[idx], nr[selectedRack]] = [nr[selectedRack], nr[idx]];
        setRack(nr); setSelectedRack(null);
      }
    }
  };

  const handleCommit = async () => {
    const placed = localBoard.reduce((acc: number[], t: any, i: number) => {
      if (t && !t.isLocked) acc.push(i); return acc;
    }, []);
    if (placed.length === 0) return;

    setIsValidating(true); setInvalidWords([]);

    const rows = [...new Set(placed.map(i => Math.floor(i/BOARD_SIZE)))];
    const cols = [...new Set(placed.map(i => i % BOARD_SIZE))];
    if (rows.length > 1 && cols.length > 1) {
      setInvalidWords(['Tiles must be in one row or column.']); setIsValidating(false); return;
    }

    const getTile = (r: number, c: number) =>
      r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE ? localBoard[r*BOARD_SIZE+c] : null;

    let gap = false;
    if (rows.length === 1) {
      const r = rows[0], mn = Math.min(...cols), mx = Math.max(...cols);
      for (let c = mn; c <= mx; c++) if (!getTile(r,c)) gap = true;
    } else {
      const c = cols[0], mn = Math.min(...rows), mx = Math.max(...rows);
      for (let r = mn; r <= mx; r++) if (!getTile(r,c)) gap = true;
    }
    if (gap) { setInvalidWords(['No gaps allowed between tiles.']); setIsValidating(false); return; }

    const isFirst = !localBoard.some((t: any) => t?.isLocked);
    if (isFirst) {
      if (!placed.includes(112)) { setInvalidWords(['First word must cover the center star.']); setIsValidating(false); return; }
      if (placed.length < 2) { setInvalidWords(['First word must be 2+ letters.']); setIsValidating(false); return; }
    } else {
      const touches = placed.some(idx => {
        const r = Math.floor(idx/BOARD_SIZE), c = idx%BOARD_SIZE;
        return [[-1,0],[1,0],[0,-1],[0,1]].some(([dr,dc]) => getTile(r+dr,c+dc)?.isLocked);
      });
      if (!touches) { setInvalidWords(['New tiles must connect to an existing word.']); setIsValidating(false); return; }
    }

    const isHorizPlay = cols.length > 1 || placed.length === 1;
    let startIdx = placed[0];
    let rMain = Math.floor(startIdx/BOARD_SIZE), cMain = startIdx%BOARD_SIZE;
    let startM = isHorizPlay ? cMain : rMain;
    while (startM > 0 && getTile(isHorizPlay?rMain:startM-1, isHorizPlay?startM-1:cMain)) startM--;
    let endM = startM;
    while (endM < BOARD_SIZE-1 && getTile(isHorizPlay?rMain:endM+1, isHorizPlay?endM+1:cMain)) endM++;

    let mWord = '', mRaw = 0, mScored = 0, mMult = 1;
    for (let i = startM; i <= endM; i++) {
        const t = getTile(isHorizPlay?rMain:i, isHorizPlay?i:cMain)!;
        mWord += t.letter; mRaw += t.value;
        let lv = t.value;
        if (!t.isLocked) {
           const sq = getSquareType(isHorizPlay?rMain:i, isHorizPlay?i:cMain);
           if (sq==='DL') lv*=2; if(sq==='TL') lv*=3;
           if (sq==='DW'||sq==='CT') mMult*=2; if(sq==='TW') mMult*=3;
        }
        mScored += lv;
    }
    const mFinalScore = mScored * mMult;

    let adjWords = new Set<string>();
    for (let i = startM; i <= endM; i++) {
        const tr = isHorizPlay ? rMain : i;
        const tc = isHorizPlay ? i : cMain;
        const neighbors = isHorizPlay ? [[tr-1,tc], [tr+1,tc]] : [[tr,tc-1], [tr,tc+1]];
        neighbors.forEach(([nr, nc]) => {
            if (getTile(nr, nc)?.isLocked) {
                let nStart = isHorizPlay ? nc : nr;
                while (nStart > 0 && getTile(isHorizPlay?nr:nStart-1, isHorizPlay?nStart-1:nc)) nStart--;
                let nEnd = nStart;
                while (nEnd < BOARD_SIZE-1 && getTile(isHorizPlay?nr:nEnd+1, isHorizPlay?nEnd+1:nc)) nEnd++;
                let adjW = '';
                for (let j = nStart; j <= nEnd; j++) adjW += getTile(isHorizPlay?nr:j, isHorizPlay?j:nc).letter;
                if (adjW.length > 1) adjWords.add(adjW);
            }
        });
    }

    let isStanza = false;
    if (adjWords.size > 0 && mWord.length > 1) {
        try {
            const res = await fetch(`https://api.datamuse.com/words?rel_rhy=${mWord}`);
            if (res.ok) {
                const data = await res.json();
                const rhymes = data.map((d:any) => d.word.toUpperCase());
                for (let w of adjWords) {
                    if (rhymes.includes(w.toUpperCase())) {
                        isStanza = true;
                        break;
                    }
                }
            }
        } catch(e) {}
    }

    const wordList: { word: string; rawSum: number; finalScore: number; isStanza?: boolean }[] = [];
    let totalScore = 0;

    if (isStanza) {
        wordList.push({ word: mWord, rawSum: mRaw, finalScore: mFinalScore * 2, isStanza: true });
        totalScore = mFinalScore * 2;
    } else {
        const seen = new Set<string>();
        placed.forEach(idx => {
            const r = Math.floor(idx/BOARD_SIZE), c = idx%BOARD_SIZE;
            [[0,1,0],[1,0,1]].forEach(([dr,dc,axis]) => {
                let start = axis === 0 ? c : r;
                while (start > 0 && getTile(axis===0?r:start-1, axis===0?start-1:c)) start--;
                let end = start;
                while (end < BOARD_SIZE-1 && getTile(axis===0?r:end+1, axis===0?end+1:c)) end++;
                if (end === start) return;
                const key = `${axis}-${axis===0?r:c}-${start}-${end}`;
                if (seen.has(key)) return; seen.add(key);

                let word = '', raw = 0, scored = 0, mult = 1;
                for (let i = start; i <= end; i++) {
                    const t = getTile(axis===0?r:i, axis===0?i:c)!;
                    word += t.letter; raw += t.value;
                    let lv = t.value;
                    if (!t.isLocked) {
                        const sq = getSquareType(axis===0?r:i, axis===0?i:c);
                        if (sq==='DL') lv*=2; if(sq==='TL') lv*=3;
                        if (sq==='DW'||sq==='CT') mult*=2; if(sq==='TW') mult*=3;
                    }
                    scored += lv;
                }
                const fs = scored * mult;
                wordList.push({ word, rawSum: raw, finalScore: fs });
                totalScore += fs;
            });
        });
    }

    const validEntries: any[] = [], failed: string[] = [];
    await Promise.all(wordList.map(async ({ word, rawSum, finalScore, isStanza }) => {
      if (word.length < 2) return;
      const tier = assignTier(word, rawSum);
      let entry: any = { word: word.toUpperCase(), tier, finalScore, isStanza };
      let found = false;
      try {
        const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data[0]) {
            const d0 = data[0];
            const m0 = d0.meanings?.[0];
            const def0 = m0?.definitions?.[0];
            entry.def = def0?.definition || 'Definition found.';
            entry.example = def0?.example || null;
            entry.pos = m0?.partOfSpeech || null;
            entry.phonetic = d0.phonetic || d0.phonetics?.[0]?.text || null;
            found = true;
          }
        }
      } catch {}
      if (!found) {
        try {
          const r2 = await fetch(`https://api.datamuse.com/words?sp=${word}&md=d&max=1`);
          const d2 = await r2.json();
          if (d2?.[0]?.word?.toLowerCase() === word.toLowerCase()) {
            entry.def = d2[0].defs?.[0]?.split('\t').pop() || 'Definition secured.';
            entry.pos = d2[0].defs?.[0]?.split('\t')[0] || null;
            found = true;
          }
        } catch {}
      }
      if (found) validEntries.push(entry);
      else failed.push(word.toUpperCase());
    }));

    setIsValidating(false);
    if (failed.length > 0) { setInvalidWords(failed); return; }

    setCurrentWords(validEntries); setCurrentScore(totalScore); setPendingSentence(true);
  };

  const commitTurn = (withSentence: boolean) => {
    let bonus = 0, sentencePayload = null;
    let triggeredDP = false;

    localBoard.forEach((tile: any, idx: number) => {
      if (tile && !tile.isLocked) {
         const r = Math.floor(idx / BOARD_SIZE);
         const c = idx % BOARD_SIZE;
         if (getSquareType(r, c) === 'DP') triggeredDP = true;
      }
    });

    if (withSentence && sentenceText.trim().length > 5) {
      bonus = 10;
      sentencePayload = {
        playerName: myTeamEntry?.name || 'Explorer',
        text: sentenceText.trim(), bonusAmount: bonus, timestamp: Date.now()
      };
    }
    const lockedBoard = localBoard.map((t: any) => t && !t.isLocked ? { ...t, isLocked: true } : t);
    const updatedScores = { ...scores, [myTeamId]: (scores[myTeamId]||0) + currentScore + bonus };
    const myJournal = [...(journals[myTeamId]||[]), ...currentWords];
    const updatedJournals = { ...journals, [myTeamId]: myJournal };

    let newBag = [...(globalBag||[])];
    let newRack = rack.map((s: any) => s === null && newBag.length > 0 ? newBag.pop() : s);
    setRack(newRack);

    const payload: any = {
      board: lockedBoard, scores: updatedScores, journals: updatedJournals,
      latestDiscoveries: currentWords, bag: newBag,
      activeTeamIndex: triggeredDP ? activeTeamIndex : (activeTeamIndex + 1) % teamArray.length,
      turnEndTime: Date.now() + timeLimit * 1000,
      isExtraTurn: triggeredDP, isTimerPaused: false
    };
    if (sentencePayload) payload.latestSentence = sentencePayload;
    onUpdateLiveState(payload);
    setPendingSentence(false); setSentenceText(''); setCurrentWords([]); setCurrentScore(0);
  };

  // ─────────────────────────────────────────────
  // PROJECTOR VIEWS
  // ─────────────────────────────────────────────
  if (isProjector) {
    const bg = { background: '#08090f', minHeight: '100%' };

    if (gameStatus === 'lobby_join') {
      return (
        <div className="wf-root" style={{ ...bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding: 48, color:'#f8fafc' }}>
          <div style={{ fontFamily:"'DM Serif Display', serif", fontSize: 72, lineHeight: 1, marginBottom: 8, background: 'linear-gradient(135deg,#f8fafc,#94a3b8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            WordForge
          </div>
          <p style={{ color:'rgba(255,255,255,0.35)', fontSize:14, letterSpacing:3, textTransform:'uppercase', marginBottom:48 }}>
            Vocabulary Discovery Game
          </p>
          <div style={{ display:'flex', alignItems:'center', gap:12, fontSize:20, color:'rgba(255,255,255,0.6)', marginBottom:40 }}>
            <Users size={28} style={{color:'#4ade80'}} />
            {Object.keys(players).length} player{Object.keys(players).length !== 1 ? 's' : ''} connected
          </div>
          <div style={{ marginBottom:40 }}>
            <p style={{ color:'rgba(255,255,255,0.3)', fontSize:11, textTransform:'uppercase', letterSpacing:2, textAlign:'center', marginBottom:12 }}>Turn duration</p>
            <div style={{ display:'flex', gap:8 }}>
              {[{l:'1 min',v:60},{l:'90 sec',v:90},{l:'2 min',v:120},{l:'5 min',v:300}].map(t => (
                <button key={t.v} onClick={() => setSelectedTime(t.v)} style={{
                  padding:'10px 20px', borderRadius:10, fontWeight:600, fontSize:14, cursor:'pointer', transition:'all 0.15s',
                  background: selectedTime === t.v ? 'rgba(79,70,229,0.25)' : 'rgba(255,255,255,0.04)',
                  border: selectedTime === t.v ? '1px solid rgba(79,70,229,0.6)' : '1px solid rgba(255,255,255,0.1)',
                  color: selectedTime === t.v ? '#a5b4fc' : 'rgba(255,255,255,0.4)'
                }}>{t.l}</button>
              ))}
            </div>
          </div>
          <button onClick={startFFA} disabled={Object.keys(players).length < 1} style={{
            padding:'14px 36px', borderRadius:12, fontSize:18, fontWeight:600, cursor:'pointer',
            background:'rgba(79,70,229,0.2)', border:'1px solid rgba(79,70,229,0.5)',
            color:'#a5b4fc', display:'flex', alignItems:'center', gap:10, opacity: Object.keys(players).length < 1 ? 0.4 : 1
          }}>
            <Rocket size={20}/> Begin Session
          </button>
          <div style={{ marginTop:48, display:'flex', flexWrap:'wrap', gap:12, justifyContent:'center', maxWidth:600 }}>
            {Object.values(players).map((p: any) => (
              <div key={p.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 16px', borderRadius:30, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)' }}>
                {p.avatar && <img src={p.avatar} style={{width:24,height:24,borderRadius:'50%'}} />}
                <span style={{fontSize:13, color:'rgba(255,255,255,0.7)'}}>{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (gameStatus === 'lobby_naming') {
      return (
        <div className="wf-root" style={{ ...bg, display:'flex', flexDirection:'column', padding:40, color:'#f8fafc' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:40 }}>
            <div>
              <div style={{ fontFamily:"'DM Serif Display', serif", fontSize:40, color:'#f8fafc' }}>Ready to forge words?</div>
              <p style={{ color:'rgba(255,255,255,0.35)', fontSize:13, marginTop:4 }}>Confirm your name on your device</p>
            </div>
            <button onClick={startGame} style={{
              padding:'12px 28px', borderRadius:10, fontSize:15, fontWeight:600, cursor:'pointer',
              background:'rgba(74,222,128,0.15)', border:'1px solid rgba(74,222,128,0.4)',
              color:'#4ade80', display:'flex', alignItems:'center', gap:8
            }}>
              <CheckCircle2 size={18}/> Start Game
            </button>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:16 }}>
            {teamArray.map((t: any) => (
              <div key={t.id} style={{ padding:'24px 28px', borderRadius:16, background:'rgba(255,255,255,0.04)', border:`1px solid ${t.color.border}`, display:'flex', alignItems:'center', gap:14, minWidth:200 }}>
                {t.avatar && <img src={t.avatar} style={{width:48,height:48,borderRadius:'50%',background:'rgba(255,255,255,0.05)'}} />}
                <div>
                  <div style={{ fontFamily:"'DM Serif Display', serif", fontSize:22, color:'#f8fafc' }}>{t.name}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:2 }}>Ready</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (gameStatus === 'finished') {
      const sorted = [...teamArray].sort((a,b) => (scores[b.id]||0)-(scores[a.id]||0));
      return (
        <div className="wf-root" style={{ ...bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:48, color:'#f8fafc', overflowY: 'auto' }}>
          <div style={{ fontFamily:"'DM Serif Display', serif", fontSize:52, marginBottom:48, color:'#f8fafc' }}>Session Complete</div>
          <div style={{ display:'flex', gap:24, alignItems:'flex-end' }}>
            {sorted.slice(0,3).map((t: any, i: number) => (
              <div key={t.id} style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                {i===0 && <Trophy size={32} style={{color:'#f59e0b', marginBottom:8}} />}
                {t.avatar && <img src={t.avatar} style={{ width:80, height:80, borderRadius:'50%', border:`3px solid ${i===0?'#f59e0b':t.color.bg}`, background:'rgba(255,255,255,0.05)', marginBottom:12 }} />}
                <div style={{ padding:'20px 28px', borderRadius:12, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', textAlign:'center', width:160, height: 180-i*30 }}>
                  <div style={{ color: t.color.bg, fontWeight:600, fontSize:14, marginBottom:6 }}>{t.name}</div>
                  <div style={{ fontFamily:"'DM Serif Display', serif", fontSize:42 }}>{scores[t.id]||0}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:4 }}>
                    {(journals[t.id]||[]).length} words found
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:48, maxWidth:800, width:'100%' }}>
            <p style={{ fontSize:11, textTransform:'uppercase', letterSpacing:2, color:'rgba(255,255,255,0.3)', marginBottom:16 }}>Vocabulary Discovered This Session</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {sorted.map((t: any) => (journals[t.id]||[]).map((e: any, i: number) => {
                const tier = TIERS[e.tier]||TIERS[2];
                return (
                  <span key={`${t.id}-${i}`} style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:tier.bg, border:`1px solid ${tier.border}`, color:tier.color }}>
                    {e.word}
                  </span>
                );
              }))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="wf-root" style={{ ...bg, display:'flex', height:'100%', padding:24, gap:24, color:'#f8fafc', overflow:'hidden' }}>
        {/* Projector Board */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', position:'relative' }}>
          <div style={{ marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
            <div style={{
              display:'flex', alignItems:'center', gap:10, padding:'8px 20px',
              borderRadius:30, background:'rgba(255,255,255,0.05)', border:`1px solid ${activeTeam?.color?.border||'rgba(255,255,255,0.1)'}`
            }}>
              {activeTeam?.avatar && <img src={activeTeam.avatar} style={{width:28,height:28,borderRadius:'50%'}} />}
              <span style={{ fontWeight:600, color: activeTeam?.color?.bg||'#f8fafc', fontSize:14 }}>{activeTeam?.name || '—'}</span>
              <span style={{ color:'rgba(255,255,255,0.5)', fontSize:13 }}>is playing</span>
              {isExtraTurn && <span style={{ background:'#d946ef', color:'white', fontSize:10, padding:'2px 6px', borderRadius:4, display:'flex', alignItems:'center', gap:4, marginLeft:8 }}><FastForward size={10}/> DOUBLE PLAY</span>}
            </div>
            <div style={{
              display:'flex', alignItems:'center', gap:8, padding:'8px 16px',
              borderRadius:30, background: isTimerPaused ? 'rgba(217,119,6,0.15)' : 'rgba(255,255,255,0.05)',
              border: isTimerPaused ? '1px solid rgba(217,119,6,0.4)' : '1px solid rgba(255,255,255,0.1)'
            }}>
              {isTimerPaused ? <Pause size={14} style={{color:'#f59e0b'}}/> : <Clock size={14} style={{color:'rgba(255,255,255,0.4)'}}/>}
              <span style={{ fontFamily:'monospace', fontWeight:700, color: isTimerPaused ? '#f59e0b' : '#f8fafc', fontSize:16 }}>
                {isTimerPaused ? 'PAUSED' : `${timeLeft}s`}
              </span>
            </div>
          </div>

          <div style={{ background:'rgba(255,255,255,0.02)', borderRadius:16, padding:10, border:'1px solid rgba(255,255,255,0.06)' }}>
            <div className="wf-board" style={{ width:660, height:660 }}>
              {(globalBoard||[]).map((tile: any, i: number) => {
                const r = Math.floor(i/BOARD_SIZE), c = i%BOARD_SIZE;
                const type = getSquareType(r,c);
                return (
                  <div key={i} style={{ ...squareStyle(r,c,false), display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
                    {!tile && type === 'CT' && <Star size={14} style={{color:'rgba(79,70,229,0.5)'}} fill="currentColor"/>}
                    {!tile && type === 'TW' && <span style={{fontSize:7,fontWeight:700,color:'rgba(220,38,38,0.6)',textTransform:'uppercase'}}>3W</span>}
                    {!tile && type === 'DW' && <span style={{fontSize:7,fontWeight:700,color:'rgba(217,119,6,0.6)',textTransform:'uppercase'}}>2W</span>}
                    {!tile && type === 'TL' && <span style={{fontSize:7,fontWeight:700,color:'rgba(8,145,178,0.6)',textTransform:'uppercase'}}>3L</span>}
                    {!tile && type === 'DL' && <span style={{fontSize:7,fontWeight:700,color:'rgba(5,150,105,0.6)',textTransform:'uppercase'}}>2L</span>}
                    {!tile && type === 'DP' && <FastForward size={14} style={{color:'rgba(217,70,239,0.5)'}} fill="currentColor"/>}
                    {tile && <Tile tile={tile} locked size="sm" isBoardTile={true} />}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{
            position:'absolute', bottom:0, left:0, display:'flex',
            background:'rgba(8,10,20,0.9)', border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:12, overflow:'hidden'
          }}>
            <div style={{ padding:'10px 14px', background:'rgba(79,70,229,0.1)', borderRight:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center' }}>
              <ShieldAlert size={16} style={{color:'rgba(79,70,229,0.8)'}}/>
            </div>
            {[
              { icon: isTimerPaused ? <Play size={14}/> : <Pause size={14}/>, label: isTimerPaused ? 'Resume' : 'Pause', action: togglePause, color:'#f59e0b' },
              { icon: <FastForward size={14}/>, label: 'Skip turn', action: passTurn, color:'rgba(255,255,255,0.5)' },
              { icon: <Power size={14}/>, label: 'End game', action: forceEnd, color:'#ef4444' },
            ].map((btn, i) => (
              <button key={i} onClick={btn.action} style={{
                padding:'10px 16px', background:'transparent', border:'none', borderRight:'1px solid rgba(255,255,255,0.08)',
                cursor:'pointer', display:'flex', alignItems:'center', gap:8, color:btn.color, fontSize:12, fontWeight:600
              }}>{btn.icon}{btn.label}</button>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ width:360, display:'flex', flexDirection:'column', gap:16, overflowY:'auto' }} className="wf-scroll">
          {latestDiscoveries.some((e: any) => e.isStanza) && (
            <div style={{ background:'rgba(217,70,239,0.15)', border:'1px solid rgba(217,70,239,0.4)', borderRadius:16, padding:'16px', textAlign:'center' }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#f8fafc', letterSpacing: 2 }}>STANZA STACK (2X)</span>
            </div>
          )}

          <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, paddingBottom:12, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              <Trophy size={16} style={{color:'#f59e0b'}}/>
              <span style={{ fontFamily:"'DM Serif Display', serif", fontSize:18, color:'#f8fafc' }}>Scores</span>
              <span style={{ marginLeft:'auto', fontSize:11, color:'rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.05)', padding:'2px 8px', borderRadius:6 }}>
                {globalBag?.length||0} tiles left
              </span>
            </div>
            {teamArray.map((t: any, idx: number) => {
              const isActive = idx === activeTeamIndex;
              const myWords = journals[t.id]||[];
              return (
                <div key={t.id} style={{
                  padding:'12px 14px', borderRadius:10, marginBottom:8, transition:'all 0.2s',
                  background: isActive ? `${t.color.muted}` : 'transparent',
                  border: isActive ? `1px solid ${t.color.border}` : '1px solid transparent'
                }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: myWords.length > 0 ? 8 : 0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      {t.avatar && <img src={t.avatar} style={{width:28,height:28,borderRadius:'50%',opacity: isActive?1:0.6}} />}
                      <span style={{ fontSize:14, fontWeight:600, color: isActive ? t.color.bg : 'rgba(255,255,255,0.6)' }}>{t.name}</span>
                    </div>
                    <span style={{ fontFamily:"'DM Serif Display', serif", fontSize:26, color: isActive ? '#f8fafc' : 'rgba(255,255,255,0.5)' }}>{scores[t.id]||0}</span>
                  </div>
                  {myWords.length > 0 && (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                      {myWords.slice(-8).map((e: any, i: number) => {
                        const tier = TIERS[e.tier]||TIERS[2];
                        return <span key={i} style={{ fontSize:9, padding:'2px 7px', borderRadius:10, background:tier.bg, border:`1px solid ${tier.border}`, color:tier.color, fontWeight:600 }}>{e.word}</span>;
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {latestDiscoveries.length > 0 && (
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                <BookOpen size={14} style={{color:'rgba(255,255,255,0.4)'}}/>
                <span style={{ fontSize:11, textTransform:'uppercase', letterSpacing:2, color:'rgba(255,255,255,0.3)' }}>Words Played</span>
              </div>
              {latestDiscoveries.map((e: any, i: number) => <WordCard key={i} entry={e} />)}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // STUDENT VIEWS
  // ─────────────────────────────────────────────
  const bg = { background: '#08090f', minHeight: '100%' };

  if (gameStatus === 'lobby_join') {
    const joined = !!players[studentId];
    return (
      <div className="wf-root wf-scroll" style={{ ...bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:32, textAlign:'center', color:'#f8fafc' }}>
        <div style={{ fontFamily:"'DM Serif Display', serif", fontSize:42, marginBottom:6 }}>WordForge</div>
        <p style={{ color:'rgba(255,255,255,0.3)', fontSize:12, letterSpacing:3, textTransform:'uppercase', marginBottom:40 }}>Vocabulary Discovery</p>
        {joined ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
            <div style={{ width:64, height:64, borderRadius:16, background:'rgba(74,222,128,0.1)', border:'1px solid rgba(74,222,128,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <CheckCircle2 size={32} style={{color:'#4ade80'}}/>
            </div>
            <p style={{ fontSize:15, fontWeight:600, color:'#f8fafc' }}>You're in!</p>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.3)', letterSpacing:2, textTransform:'uppercase' }}>Waiting for the session to start...</p>
          </div>
        ) : (
          <button onClick={joinLobby} style={{
            padding:'16px 40px', borderRadius:14, fontSize:17, fontWeight:600, cursor:'pointer',
            background:'rgba(79,70,229,0.15)', border:'1px solid rgba(79,70,229,0.4)',
            color:'#a5b4fc', transition:'all 0.15s'
          }}>
            Join Session
          </button>
        )}
      </div>
    );
  }

  if (gameStatus === 'lobby_naming') {
    if (!myTeamEntry) return <div className="wf-root wf-scroll" style={{ ...bg, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.3)', fontSize:13 }}>Spectator mode</div>;
    return (
      <div className="wf-root wf-scroll" style={{ ...bg, display:'flex', flexDirection:'column', padding:24, color:'#f8fafc' }}>
        <div style={{ padding:24, borderRadius:20, background:'rgba(255,255,255,0.04)', border:`1px solid ${myTeamEntry.color?.border||'rgba(255,255,255,0.1)'}`, display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', marginBottom:20 }}>
          {myTeamEntry.avatar && <img src={myTeamEntry.avatar} style={{width:64,height:64,borderRadius:'50%',marginBottom:12,background:'rgba(255,255,255,0.05)'}} />}
          <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:2, display:'block', marginBottom:4 }}>Your name</span>
          <span style={{ fontFamily:"'DM Serif Display', serif", fontSize:28, color:myTeamEntry.color?.bg||'#f8fafc' }}>{myTeamEntry.name}</span>
        </div>
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:20 }}>
          <label style={{ fontSize:11, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:2, display:'block', marginBottom:10 }}>Update name</label>
          <input
            defaultValue={myTeamEntry.name}
            onBlur={e => {
              const v = e.target.value.trim();
              if (v && myTeamId) {
                const upd = { ...teams }; upd[myTeamId].name = v;
                onUpdateLiveState({ teams: upd });
              }
            }}
            maxLength={15}
            style={{
              width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)',
              borderRadius:10, padding:'12px 16px', color:'#f8fafc', fontSize:16, fontFamily:"'DM Sans', sans-serif",
              outline:'none', boxSizing:'border-box', textAlign:'center'
            }}
          />
          <p style={{ fontSize:10, color:'rgba(255,255,255,0.2)', textAlign:'center', marginTop:8 }}>Saved automatically</p>
        </div>
        <p style={{ color:'rgba(255,255,255,0.2)', fontSize:11, textTransform:'uppercase', letterSpacing:2, textAlign:'center', marginTop:'auto', paddingTop:24 }}>Waiting for the teacher to start...</p>
      </div>
    );
  }

  if (gameStatus === 'finished') {
    const myScore = scores[myTeamId]||0;
    const sorted = [...teamArray].sort((a,b) => (scores[b.id]||0)-(scores[a.id]||0));
    const rank = sorted.findIndex((t: any) => t.id === myTeamId)+1;
    const myJournal = journals[myTeamId]||[];
    return (
      <div className="wf-root wf-scroll" style={{ ...bg, display:'flex', flexDirection:'column', padding:24, color:'#f8fafc', overflowY:'auto' }}>
        <div style={{ fontFamily:"'DM Serif Display', serif", fontSize:32, marginBottom:4 }}>Session Complete</div>
        <p style={{ color:'rgba(255,255,255,0.35)', fontSize:12, marginBottom:24 }}>Here's what you discovered</p>
        <div style={{ padding:24, borderRadius:20, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', textAlign:'center', marginBottom:24 }}>
          <div style={{ fontFamily:"'DM Serif Display', serif", fontSize:56, lineHeight:1 }}>{myScore}</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:2, marginTop:4 }}>points · Rank #{rank}</div>
        </div>
        {myJournal.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize:11, textTransform:'uppercase', letterSpacing:2, color:'rgba(255,255,255,0.3)', marginBottom:14 }}>Your word journal ({myJournal.length} words)</p>
            {myJournal.map((e: any, i: number) => <WordCard key={i} entry={e} />)}
          </div>
        )}
      </div>
    );
  }

  if (isMyTurn && pendingSentence) {
    const isStanzaBonus = currentWords.some(w => w.isStanza);
    return (
      <div className="wf-root wf-scroll" style={{ ...bg, display:'flex', flexDirection:'column', padding:24, color:'#f8fafc', overflowY:'auto' }}>
        {isStanzaBonus && (
            <div style={{ background:'rgba(217,70,239,0.15)', border:'1px solid rgba(217,70,239,0.4)', borderRadius:12, padding:'12px', textAlign:'center', marginBottom:16 }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: '#f8fafc', letterSpacing: 2 }}>STANZA STACK (2X)</span>
            </div>
        )}
        <div style={{ fontFamily:"'DM Serif Display', serif", fontSize:28, marginBottom:4 }}>Words found!</div>
        <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)', marginBottom:20 }}>
            {isStanzaBonus 
                ? "Write a rhyming couplet using your word at the end of the first line to earn +10 points." 
                : "Earn +5 points by writing a sentence using one of these words."}
        </p>
        <div style={{ marginBottom:20 }}>
          {currentWords.map((e,i) => <WordCard key={i} entry={e} />)}
        </div>
        <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:16, padding:16, border:'1px solid rgba(255,255,255,0.08)', marginBottom:16 }}>
          <label style={{ fontSize:11, textTransform:'uppercase', letterSpacing:2, color:'rgba(255,255,255,0.3)', display:'block', marginBottom:10 }}>
            {isStanzaBonus ? "Write your Rhyming Couplet" : "Write your sentence"}
          </label>
          <textarea
            value={sentenceText}
            onChange={e => setSentenceText(e.target.value)}
            placeholder={isStanzaBonus ? "Line 1 ends with your word...\nLine 2 ends with a rhyme..." : "e.g. The ancient temple was a remarkable structure..."}
            style={{
              width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)',
              borderRadius:10, padding:'12px 14px', color:'#f8fafc', fontSize:14, fontFamily:"'DM Sans', sans-serif",
              outline:'none', resize:'vertical', minHeight:100, boxSizing:'border-box',
              lineHeight: 1.6
            }}
          />
        </div>
        <button
          onClick={() => commitTurn(true)}
          disabled={sentenceText.trim().length < 6}
          style={{
            padding:'13px 20px', borderRadius:12, fontSize:14, fontWeight:600, cursor:'pointer',
            background: sentenceText.trim().length >= 6 ? 'rgba(245,208,90,0.15)' : 'rgba(255,255,255,0.04)',
            border: sentenceText.trim().length >= 6 ? '1px solid rgba(245,208,90,0.4)' : '1px solid rgba(255,255,255,0.08)',
            color: sentenceText.trim().length >= 6 ? '#f5d05a' : 'rgba(255,255,255,0.25)',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:8
          }}
        >
          <MessageSquare size={16}/> Submit with bonus (+{isStanzaBonus ? '10' : '5'})
        </button>
        <button onClick={() => commitTurn(false)} style={{
          padding:'13px 20px', borderRadius:12, fontSize:13, cursor:'pointer',
          background:'transparent', border:'none', color:'rgba(255,255,255,0.3)', fontWeight:500
        }}>Skip bonus, play word</button>
      </div>
    );
  }

  // ── MAIN GAME (Student) ──
  const myJournal = journals[myTeamId] || [];
  
  return (
    <div className="wf-root" style={{ ...bg, display:'flex', flexDirection:'column', height:'100%', padding:10, overflow:'hidden', position:'relative' }}>

      {/* Journal overlay */}
      {showJournal && <JournalPanel words={myJournal} onClose={() => setShowJournal(false)} />}

      {/* Header bar */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8,
        padding:'8px 12px', borderRadius:12,
        background: isMyTurn ? 'rgba(79,70,229,0.1)' : 'rgba(255,255,255,0.03)',
        border: isMyTurn ? '1px solid rgba(79,70,229,0.25)' : '1px solid rgba(255,255,255,0.07)'
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          {isTimerPaused ? <Pause size={13} style={{color:'#f59e0b'}}/> : <Clock size={13} style={{color:'rgba(255,255,255,0.3)'}}/>}
          <span style={{ fontFamily:'monospace', fontSize:14, fontWeight:700, color: isTimerPaused ? '#f59e0b' : (isMyTurn ? '#a5b4fc' : 'rgba(255,255,255,0.4)') }}>
            {isTimerPaused ? 'Paused' : `${timeLeft}s`}
          </span>
        </div>
        <span style={{ fontSize:12, fontWeight:600, color: isMyTurn ? '#a5b4fc' : 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 6 }}>
          {isExtraTurn && isMyTurn && <FastForward size={12} style={{color:'#d946ef'}} />}
          {isMyTurn ? 'Your turn' : `${activeTeam?.name}'s turn`}
        </span>
        <button onClick={() => setShowJournal(true)} style={{
          display:'flex', alignItems:'center', gap:6, padding:'5px 10px', borderRadius:8,
          background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)',
          cursor:'pointer', color:'rgba(255,255,255,0.5)', fontSize:11, fontWeight:600
        }}>
          <BookOpen size={12}/> Journal {myJournal.length > 0 && `(${myJournal.length})`}
        </button>
      </div>

      {/* Board area with Mobile Optimization & 3D Engine */}
      <div style={{ flex:1, overflow:'auto', borderRadius:12, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', position:'relative', marginBottom:8, perspective: '1200px' }} className="wf-scroll">
        
        {/* 🔥 TACTICAL HUD */}
        <div style={{
          position:'sticky', top:8, left:'calc(100% - 44px)', float:'right', zIndex:50,
          display:'flex', flexDirection:'column', gap:0,
          background:'rgba(8,10,20,0.9)', border:'1px solid rgba(255,255,255,0.1)',
          borderRadius:10, overflow:'hidden', marginRight:8, width:32
        }}>
          {[{icon:<Layers size={14}/>, fn:() => setViewAngle(p=>(p+1)%3)},
            {icon:<ZoomIn size={14}/>, fn:() => setZoom(p=>Math.min(p+0.2,2.0))},
            {icon:<LocateFixed size={14}/>, fn:() => { setZoom(1); setViewAngle(0); }},
            {icon:<ZoomOut size={14}/>, fn:() => setZoom(p=>Math.max(p-0.2,0.5))}
          ].map((b, i) => (
            <button key={i} onClick={b.fn} style={{
              width:32, height:30, display:'flex', alignItems:'center', justifyContent:'center',
              background:'transparent', border:'none', borderBottom: i<3?'1px solid rgba(255,255,255,0.07)':undefined,
              cursor:'pointer', color:'rgba(255,255,255,0.4)', transition:'color 0.1s'
            }}>{b.icon}</button>
          ))}
        </div>

        {/* 🔥 3D BOARD WRAPPER */}
        <div style={{ transformOrigin:'top left', transform:`scale(${zoom})`, width:`${720*zoom}px`, height:`${720*zoom}px` }}>
          <div className="wf-board" style={{ 
              width:720, height:720, padding:8, boxSizing:'border-box',
              transformStyle: 'preserve-3d',
              transform: getTransform(),
              transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            {(localBoard||[]).map((tile: any, idx: number) => {
              const r = Math.floor(idx/BOARD_SIZE), c = idx%BOARD_SIZE;
              const isTarget = targetSquare === idx;
              const type = getSquareType(r,c);
              return (
                <div key={idx} onClick={() => handleBoardClick(idx)} style={{ ...squareStyle(r,c,isTarget), display:'flex', alignItems:'center', justifyContent:'center', position:'relative', cursor: isMyTurn&&!tile?.isLocked ? 'pointer' : 'default' }}>
                  {!tile && type === 'CT' && <Star size={10} style={{color:'rgba(79,70,229,0.4)', transform: viewAngle > 0 ? 'translateZ(2px)' : 'none'}} fill="currentColor"/>}
                  {!tile && type === 'TW' && <span style={{fontSize:6,fontWeight:700,color:'rgba(220,38,38,0.5)',textTransform:'uppercase', transform: viewAngle > 0 ? 'translateZ(2px)' : 'none'}}>3W</span>}
                  {!tile && type === 'DW' && <span style={{fontSize:6,fontWeight:700,color:'rgba(217,119,6,0.5)',textTransform:'uppercase', transform: viewAngle > 0 ? 'translateZ(2px)' : 'none'}}>2W</span>}
                  {!tile && type === 'TL' && <span style={{fontSize:6,fontWeight:700,color:'rgba(8,145,178,0.5)',textTransform:'uppercase', transform: viewAngle > 0 ? 'translateZ(2px)' : 'none'}}>3L</span>}
                  {!tile && type === 'DL' && <span style={{fontSize:6,fontWeight:700,color:'rgba(5,150,105,0.5)',textTransform:'uppercase', transform: viewAngle > 0 ? 'translateZ(2px)' : 'none'}}>2L</span>}
                  {!tile && type === 'DP' && <FastForward size={14} style={{color:'rgba(217,70,239,0.5)', transform: viewAngle > 0 ? 'translateZ(2px)' : 'none'}} fill="currentColor"/>}

                  {/* Orbital tile selector */}
                  {isTarget && !tile && isMyTurn && !isTimerPaused && (
                    <div style={{ position:'absolute', top:'50%', left:'50%', width:0, height:0, zIndex:100, transform:`scale(${1/zoom}) ${viewAngle > 0 ? 'translateZ(40px)' : ''}`, transformStyle: 'preserve-3d' }}>
                      {/* 🔥 NEW: Radial gradient eclipse to separate orbital menu from board */}
                      <div style={{ position: 'absolute', width: 280, height: 280, left: -140, top: -140, background: 'radial-gradient(circle, rgba(0,0,0,0.85) 20%, rgba(0,0,0,0.4) 50%, transparent 70%)', zIndex: 10, pointerEvents: 'none', borderRadius: '50%' }} />
                      
                      {rack.map((rt: any, ri: number) => {
                        if (!rt) return null;
                        const angle = (ri/7)*Math.PI*2 - Math.PI/2;
                        const rad = 88;
                        const x = Math.cos(angle)*rad, y = Math.sin(angle)*rad;
                        return (
                          <div key={`orb_${ri}`} onClick={e => { e.stopPropagation(); handleRackClick(ri); }}
                            style={{ position:'absolute', width:40, height:40, marginLeft:-20, marginTop:-20, transform:`translate(${x}px,${y}px)`, zIndex:200 }}>
                            {/* 🔥 NEW: Passed isSolid to orbital tiles */}
                            <Tile tile={rt} size="md" isSolid={true} />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {tile && <Tile tile={tile} locked={tile.isLocked} size="sm" isBoardTile={viewAngle > 0} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Error banner */}
      {invalidWords.length > 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', borderRadius:10, background:'rgba(220,38,38,0.15)', border:'1px solid rgba(220,38,38,0.3)', marginBottom:6, fontSize:12, color:'#fca5a5' }}>
          <AlertTriangle size={13}/> {invalidWords.join(', ')} — not found in dictionary
        </div>
      )}

      {/* Rack */}
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'10px 12px', marginBottom:8 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <span style={{ fontSize:10, textTransform:'uppercase', letterSpacing:2, color: isMyTurn ? 'rgba(165,180,252,0.6)' : 'rgba(255,255,255,0.2)' }}>
            {isTimerPaused ? 'Paused by instructor' : (isMyTurn ? (targetSquare !== null ? 'Tap a tile to place' : 'Tap board to pick a square') : 'Waiting...')}
          </span>
          <div style={{ display:'flex', gap:6 }}>
            <button 
                onClick={handlePurge} 
                disabled={!isMyTurn || isValidating || isTimerPaused || (scores[myTeamId] || 0) < 10}
                title="Purge Hand (-10 XP)"
                style={{ width:28, height:28, borderRadius:7, background:'rgba(244,63,94,0.15)', border:'1px solid rgba(244,63,94,0.3)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#fb7185', opacity: (!isMyTurn || isValidating || isTimerPaused || (scores[myTeamId] || 0) < 10)?0.3:1 }}
            >
                <RefreshCw size={13} />
            </button>
            <button onClick={shuffleRack} disabled={isTimerPaused} style={{ width:28, height:28, borderRadius:7, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.4)', opacity: isTimerPaused?0.3:1 }}>
              <Shuffle size={13}/>
            </button>
          </div>
        </div>
        <div style={{ display:'flex', gap:6, justifyContent:'center', minHeight:44 }}>
          {rack.map((tile: any, i: number) => (
            <div key={i} onClick={() => handleRackClick(i)} style={{ width:40, height:40, borderRadius:8, background: tile ? undefined : 'rgba(255,255,255,0.02)', border: tile ? undefined : '1px dashed rgba(255,255,255,0.06)', opacity: isTimerPaused ? 0.4 : 1 }}>
              {/* 🔥 NEW: Passed isSolid to rack tiles */}
              {tile && <Tile tile={tile} selected={selectedRack===i} size="md" isSolid={true} />}
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={recallAll} disabled={isValidating||isTimerPaused} style={{
          flex:1, padding:'12px 0', borderRadius:12, fontSize:12, fontWeight:600, cursor:'pointer',
          background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)',
          color:'rgba(255,255,255,0.5)', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
          opacity: isValidating||isTimerPaused ? 0.4 : 1
        }}>
          <ArrowDownToLine size={14}/> Recall
        </button>
        {isMyTurn ? (
          <button onClick={handleCommit} disabled={isValidating||isTimerPaused} style={{
            flex:2, padding:'12px 0', borderRadius:12, fontSize:13, fontWeight:600, cursor:'pointer',
            background: 'rgba(79,70,229,0.15)', border:'1px solid rgba(79,70,229,0.4)',
            color:'#a5b4fc', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            opacity: isValidating||isTimerPaused ? 0.5 : 1
          }}>
            {isValidating ? <><Loader2 size={14} style={{animation:'spin 1s linear infinite'}}/> Checking...</> : <><CheckCircle2 size={14}/> Play Word</>}
          </button>
        ) : (
          <div style={{ flex:2, padding:'12px 0', borderRadius:12, fontSize:12, textAlign:'center', color:'rgba(255,255,255,0.2)', border:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            Standby...
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
