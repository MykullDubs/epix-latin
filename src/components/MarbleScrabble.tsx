// src/components/MarbleScrabble.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Trophy, Clock, CheckCircle2, FastForward, ArrowDownToLine,
  Star, Users, User, MessageSquare, Shuffle, Loader2,
  AlertTriangle, Rocket, RefreshCw, ZoomIn, ZoomOut,
  LocateFixed, Pause, Play, Power, ShieldAlert, BookOpen, Layers,
  PenTool, BookmarkPlus, Check, Sparkles, Volume2
} from 'lucide-react';
import { collection, doc, setDoc, addDoc, updateDoc, increment } from 'firebase/firestore';
import { db, appId, auth } from '../config/firebase';
import SmartboardQRCode from './SmartboardQRCode';

// ─────────────────────────────────────────────
// CONSTANTS & CEFR TIERS
// ─────────────────────────────────────────────
const BOARD_SIZE = 15;

const TIERS: Record<number, { label: string; color: string; bg: string; border: string; points: number }> = {
  1: { label: 'A1 — Basic',        color: '#16a34a', bg: 'rgba(22,163,74,0.12)',   border: 'rgba(22,163,74,0.35)',   points: 1 },
  2: { label: 'A2 — Elementary',   color: '#2563eb', bg: 'rgba(37,99,235,0.12)',   border: 'rgba(37,99,235,0.35)',   points: 1.5 },
  3: { label: 'B1 — Intermediate', color: '#7c3aed', bg: 'rgba(124,58,237,0.12)',  border: 'rgba(124,58,237,0.35)',  points: 2 },
  4: { label: 'B2 — Upper Int.',   color: '#c2410c', bg: 'rgba(194,65,12,0.12)',   border: 'rgba(194,65,12,0.35)',   points: 2.5 },
  5: { label: 'C1 — Advanced',     color: '#e11d48', bg: 'rgba(225,29,72,0.15)',   border: 'rgba(225,29,72,0.45)',   points: 3 },
  6: { label: '★ Curriculum Term', color: '#f59e0b', bg: 'rgba(245,158,11,0.16)',  border: 'rgba(245,158,11,0.55)',  points: 4 }
};

function assignTier(word: string, rawLetterSum: number, isCurriculumWord = false): number {
  if (isCurriculumWord) return 6;
  const len = word.length;
  const avg = rawLetterSum / Math.max(1, len);
  if (len <= 3 && avg < 3) return 1;
  if (len <= 4 && avg < 4) return 2;
  if (len <= 6 && avg < 5) return 3;
  if (len <= 8 && avg < 7) return 4;
  return 5;
}

const LETTER_DATA: Record<string, { count: number; value: number }> = {
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

// Built-in Classical Latin & Core Curriculum Seed Dictionary so Latin/Spanish words validate even offline
const CLASSICAL_SEED_WORDS: Record<string, { def: string; pos: string; phonetic?: string }> = {
  SALVE: { def: 'Hello! / Be in good health! (Singular imperative)', pos: 'interjection / verb', phonetic: 'sal.weː' },
  SALVETE: { def: 'Hello! (Plural imperative used to greet a group)', pos: 'interjection / verb', phonetic: 'salˈweː.te' },
  VALE: { def: 'Farewell! / Be strong!', pos: 'interjection / verb', phonetic: 'wa.leː' },
  VULNUS: { def: 'A wound, injury, or mental blow (3rd declension neuter)', pos: 'noun', phonetic: 'wul.nus' },
  GALLIA: { def: 'Ancient Gaul (encompassing modern France and northern Italy)', pos: 'proper noun', phonetic: 'ɡal.li.a' },
  DIVISA: { def: 'Divided, separated, distributed (perfect passive participle)', pos: 'adjective / participle', phonetic: 'diːˈwiː.sa' },
  ROMA: { def: 'Rome, capital of the Roman Republic and Empire', pos: 'proper noun', phonetic: 'roː.ma' },
  AMOR: { def: 'Love, affection, strong desire', pos: 'noun', phonetic: 'a.mor' },
  PAX: { def: 'Peace, treaty, tranquility, harmony', pos: 'noun', phonetic: 'paːks' },
  LEX: { def: 'Law, statute, legal principle, covenant', pos: 'noun', phonetic: 'leːks' },
  REX: { def: 'King, monarch, ruler', pos: 'noun', phonetic: 'reːks' },
  LUX: { def: 'Light, daylight, clarity, life', pos: 'noun', phonetic: 'luːks' },
  AQUA: { def: 'Water, stream, rain', pos: 'noun', phonetic: 'a.kʷa' },
  TERRA: { def: 'Earth, land, ground, country', pos: 'noun', phonetic: 'ter.ra' },
  VIA: { def: 'Road, way, street, journey, method', pos: 'noun', phonetic: 'wi.a' },
  VITA: { def: 'Life, way of life, existence', pos: 'noun', phonetic: 'wiː.ta' },
  SENATUS: { def: 'The Roman Senate; council of elders', pos: 'noun', phonetic: 'seˈnaː.tus' },
  POPULUS: { def: 'The people, nation, citizens, public', pos: 'noun', phonetic: 'po.pu.lus' },
  BELLUM: { def: 'War, warfare, combat', pos: 'noun', phonetic: 'bel.lum' },
  FORUM: { def: 'Public square, marketplace, center of civic life', pos: 'noun', phonetic: 'fo.rum' }
};

const PLAYER_COLORS = [
  { bg: '#4f46e5', muted: 'rgba(79,70,229,0.15)', border: 'rgba(79,70,229,0.4)' },
  { bg: '#dc2626', muted: 'rgba(220,38,38,0.15)',  border: 'rgba(220,38,38,0.4)' },
  { bg: '#d97706', muted: 'rgba(217,119,6,0.15)',  border: 'rgba(217,119,6,0.4)' },
  { bg: '#059669', muted: 'rgba(5,150,105,0.15)',  border: 'rgba(5,150,105,0.4)' },
  { bg: '#7c3aed', muted: 'rgba(124,58,237,0.15)', border: 'rgba(124,58,237,0.4)' },
  { bg: '#0891b2', muted: 'rgba(8,145,178,0.15)',  border: 'rgba(8,145,178,0.4)' }
];

const getSquareType = (r: number, c: number) => {
  if (r === 7 && c === 7) return 'CT';
  if ((r === 0 || r === 7 || r === 14) && (c === 0 || c === 7 || c === 14) && !(r === 7 && c === 7)) return 'TW';
  const dwD = [1, 2, 3, 4, 10, 11, 12, 13];
  if (r === c && dwD.includes(r)) return 'DW';
  if (14 - r === c && dwD.includes(r)) return 'DW';
  const tl = [[1,5],[1,9],[5,1],[5,5],[5,9],[5,13],[9,1],[9,5],[9,9],[9,13],[13,5],[13,9]];
  if (tl.some(([tr, tc]) => tr === r && tc === c)) return 'TL';
  const dl = [[0,3],[0,11],[2,6],[2,8],[3,0],[3,7],[3,14],[6,2],[6,6],[6,8],[6,12],[7,3],[7,11],[8,2],[8,6],[8,8],[8,12],[11,0],[11,7],[11,14],[12,6],[12,8],[14,3],[14,11]];
  if (dl.some(([tr, tc]) => tr === r && tc === c)) return 'DL';
  const dpPoints = [[1,7],[7,1],[7,13],[13,7]];
  if (dpPoints.some(([tr, tc]) => tr === r && tc === c)) return 'DP';
  return null;
};

const createBag = () => {
  const bag: any[] = [];
  let id = 0;
  Object.entries(LETTER_DATA).forEach(([letter, d]) => {
    for (let i = 0; i < d.count; i++) bag.push({ id: `t${id++}`, letter, value: d.value });
  });
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
};

// ─────────────────────────────────────────────
// 3D NEON TILE COMPONENT
// ─────────────────────────────────────────────
const Tile = ({ tile, selected, locked, onClick, size = 'md', isBoardTile = false, isSolid = false }: any) => {
  if (!tile) return null;
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-14 h-14 text-xl' : 'w-10 h-10 text-base';
  const zDepth = isBoardTile
    ? selected ? 'translateZ(30px) scale(1.15)' : 'translateZ(12px)'
    : selected ? 'translateY(-5px) scale(1.1)' : 'none';

  const defaultBg = isSolid ? '#0f172a' : 'rgba(255,255,255,0.06)';
  const defaultBorder = isSolid ? '1px solid rgba(148, 163, 184, 0.5)' : '1px solid rgba(255,255,255,0.2)';
  const selectedBg = isSolid ? '#78350f' : 'rgba(245,208,90,0.3)';
  const selectedBorder = isSolid ? '2px solid #f59e0b' : '2px solid rgba(245,208,90,0.9)';

  const neonGlow = isSolid ? 'none' : '0 0 10px rgba(192,132,252,0.4), inset 0 0 15px rgba(192,132,252,0.2)';
  const selectedGlow = '0 0 25px rgba(245,208,90,0.6), inset 0 0 20px rgba(245,208,90,0.4)';
  const letterGlow = isSolid ? 'none' : '0 0 8px #fff, 0 0 15px #d946ef';

  return (
    <div
      onClick={!locked ? onClick : undefined}
      translate="no"
      style={{
        background: selected ? selectedBg : defaultBg,
        border: selected ? selectedBorder : defaultBorder,
        boxShadow: selected ? selectedGlow : neonGlow,
        transform: zDepth,
        transformStyle: 'preserve-3d',
        cursor: locked ? 'default' : 'pointer',
        fontFamily: "'DM Serif Display', serif"
      }}
      className={`notranslate ${sz} relative flex items-center justify-center rounded-lg transition-all duration-300 select-none ${!isSolid ? 'backdrop-blur-md' : ''}`}
    >
      <span style={{ color: locked ? 'rgba(255,255,255,0.75)' : '#ffffff', fontWeight: 900, lineHeight: 1, textShadow: letterGlow }}>
        {tile.letter}
      </span>
      <span
        style={{
          position: 'absolute', bottom: 1, right: 2,
          fontSize: 8, fontWeight: 800, color: '#fcd34d',
          fontFamily: 'monospace', lineHeight: 1,
          textShadow: isSolid ? 'none' : '0 0 5px #f59e0b'
        }}
      >
        {tile.value}
      </span>
    </div>
  );
};

// ─────────────────────────────────────────────
// WORD DISCOVERY CARD (WITH TTS PRONUNCIATION)
// ─────────────────────────────────────────────
const WordCard = ({ entry }: any) => {
  const tier = TIERS[entry.tier] || TIERS[2];
  const speakWord = (e: React.MouseEvent) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(entry.word));
    }
  };

  return (
    <div
      style={{
        background: tier.bg,
        border: `1px solid ${tier.border}`,
        borderRadius: 12,
        padding: '10px 14px',
        marginBottom: 8,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {entry.isStanza && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#d946ef', boxShadow: '0 0 10px #d946ef' }} />
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, gap: 8 }}>
        <span
          translate="no"
          className="notranslate"
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 18,
            color: '#f8fafc',
            letterSpacing: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            textShadow: '0 0 10px rgba(255,255,255,0.3)'
          }}
        >
          {entry.word}
          <button
            type="button"
            onClick={speakWord}
            style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 2, display: 'flex' }}
            title="Pronounce"
          >
            <Volume2 size={13} />
          </button>
          {entry.isStanza && (
            <span title="Stanza Stack (2x)" style={{ display: 'flex', alignItems: 'center' }}>
              <Layers size={14} style={{ color: '#d946ef', filter: 'drop-shadow(0 0 5px #d946ef)' }} />
            </span>
          )}
        </span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 1,
            color: tier.color,
            background: tier.bg,
            border: `1px solid ${tier.border}`,
            borderRadius: 6,
            padding: '2px 7px',
            whiteSpace: 'nowrap'
          }}
        >
          {tier.label}
        </span>
      </div>
      {entry.phonetic && (
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 3 }}>
          /{entry.phonetic}/
        </span>
      )}
      {entry.pos && (
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontStyle: 'italic', display: 'block', marginBottom: 3 }}>
          {entry.pos}
        </span>
      )}
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, margin: 0 }}>
        {entry.def}
      </p>
    </div>
  );
};

// ─────────────────────────────────────────────
// JOURNAL PANEL (WITH 1-CLICK FLASHCARD EXPORT)
// ─────────────────────────────────────────────
const JournalPanel = ({ words, onClose, onExportToDeck, isExporting, exportedSuccess }: any) => {
  const byTier = [6, 5, 4, 3, 2, 1]
    .map(t => ({
      tier: t,
      entries: words.filter((w: any) => w.tier === t)
    }))
    .filter(g => g.entries.length > 0);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 100,
        background: 'rgba(8,10,20,0.97)',
        overflowY: 'auto',
        borderRadius: 16,
        padding: 20,
        backdropFilter: 'blur(10px)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 8 }}>
        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: '#f8fafc' }}>
          Word Journal ({words.length})
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          {words.length > 0 && onExportToDeck && (
            <button
              type="button"
              disabled={isExporting || exportedSuccess}
              onClick={onExportToDeck}
              style={{
                background: exportedSuccess ? 'rgba(22,163,74,0.2)' : 'rgba(79,70,229,0.25)',
                border: exportedSuccess ? '1px solid rgba(22,163,74,0.5)' : '1px solid rgba(79,70,229,0.5)',
                borderRadius: 8,
                color: exportedSuccess ? '#4ade80' : '#a5b4fc',
                padding: '5px 12px',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              {exportedSuccess ? <><Check size={13} /> Saved to Deck</> : <><BookmarkPlus size={13} /> Save to Flashcards</>}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8,
              color: 'rgba(255,255,255,0.7)',
              padding: '5px 12px',
              cursor: 'pointer',
              fontSize: 12
            }}
          >
            Close
          </button>
        </div>
      </div>

      {words.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
          No words forged yet. Play tiles on the board to build your lexicon!
        </p>
      ) : (
        byTier.map(({ tier, entries }) => (
          <div key={tier} style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                color: TIERS[tier].color,
                marginBottom: 8,
                textShadow: `0 0 8px ${TIERS[tier].color}`
              }}
            >
              {TIERS[tier].label} — {entries.length} word{entries.length !== 1 ? 's' : ''}
            </div>
            {entries.map((e: any, i: number) => (
              <WordCard key={i} entry={e} />
            ))}
          </div>
        ))
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// SQUARE STYLES
// ─────────────────────────────────────────────
const squareStyle = (r: number, c: number, targeted: boolean) => {
  const type = getSquareType(r, c);
  let bg = 'rgba(255,255,255,0.02)';
  let border = 'rgba(255,255,255,0.08)';
  if (type === 'TW') { bg = 'rgba(220,38,38,0.15)'; border = 'rgba(220,38,38,0.4)'; }
  else if (type === 'DW') { bg = 'rgba(217,119,6,0.15)'; border = 'rgba(217,119,6,0.4)'; }
  else if (type === 'TL') { bg = 'rgba(8,145,178,0.15)'; border = 'rgba(8,145,178,0.4)'; }
  else if (type === 'DL') { bg = 'rgba(5,150,105,0.15)'; border = 'rgba(5,150,105,0.4)'; }
  else if (type === 'CT') { bg = 'rgba(79,70,229,0.2)'; border = 'rgba(79,70,229,0.5)'; }
  else if (type === 'DP') { bg = 'rgba(217,70,239,0.15)'; border = 'rgba(217,70,239,0.4)'; }

  if (targeted) { bg = 'rgba(245,208,90,0.15)'; border = 'rgba(245,208,90,0.6)'; }
  return { background: bg, border: `1px solid ${border}`, borderRadius: 4, transformStyle: 'preserve-3d' as const };
};

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function WordForge({ block, isProjector, liveState, studentId, onUpdateLiveState, classId }: any) {
  const timeLimit = liveState?.timeLimit || block?.timePerTurnSeconds || 90;
  const [selectedTime, setSelectedTime] = useState(90);

  // Resolve classId reliably from prop, liveState, block, or URL
  const resolvedClassId = useMemo(() => {
    return (
      classId ||
      liveState?.classId ||
      block?.classId ||
      new URLSearchParams(window.location.search).get('classId') ||
      'LIVE_ROOM'
    );
  }, [classId, liveState?.classId, block?.classId]);

  // Build a custom curriculum dictionary from block.items or block.vocab so lesson words are always accepted
  const customLessonDictionary = useMemo(() => {
    const map: Record<string, { def: string; pos: string }> = { ...CLASSICAL_SEED_WORDS };
    const rawItems = Array.isArray(block?.items) ? block.items : Array.isArray(block?.vocab) ? block.vocab : [];
    rawItems.forEach((item: any) => {
      if (typeof item === 'string') {
        map[item.trim().toUpperCase()] = { def: 'Lesson target vocabulary term.', pos: 'curriculum term' };
      } else if (item && typeof item === 'object') {
        const w = String(item.term || item.front || item.word || '').trim().toUpperCase();
        const d = String(item.definition || item.back || item.meaning || 'Lesson target vocabulary term.');
        if (w) map[w] = { def: d, pos: item.type || item.partOfSpeech || 'curriculum term' };
      }
    });
    return map;
  }, [block]);

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
        .wf-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
        @keyframes neon-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float { animation: neon-float 5s ease-in-out infinite; }
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
  const liveRacks: Record<string, any[]> = liveState?.racks || {};
  const liveAngles: Record<string, number> = liveState?.angles || {};

  const latestDiscoveries: any[] = liveState?.latestDiscoveries || [];
  const activeTeamIndex = liveState?.activeTeamIndex || 0;
  const turnEndTime = liveState?.turnEndTime;
  const isTimerPaused = liveState?.isTimerPaused || false;
  const remainingPausedTime = liveState?.remainingPausedTime || 0;
  const isExtraTurn = liveState?.isExtraTurn || false;

  const teamArray = useMemo(
    () => Object.values(teams).sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)),
    [teams]
  );
  const activeTeam: any = teamArray[activeTeamIndex] || teamArray[0] || {};
  const myTeamEntry: any = Object.values(teams).find((t: any) => t.members?.includes(studentId));
  const myTeamId = myTeamEntry?.id;
  const isMyTurn = Boolean(myTeamId && myTeamId === activeTeam?.id && gameStatus === 'playing');
  const myJournal = (myTeamId && journals[myTeamId]) || [];

  const [localBoard, setLocalBoard] = useState<any[]>(Array(BOARD_SIZE * BOARD_SIZE).fill(null));
  const [rack, setRack] = useState<any[]>(Array(7).fill(null));
  const [selectedRack, setSelectedRack] = useState<number | null>(null);

  const [isValidating, setIsValidating] = useState(false);
  const [invalidWords, setInvalidWords] = useState<string[]>([]);
  const [pendingSentence, setPendingSentence] = useState(false);
  const [sentenceText, setSentenceText] = useState('');
  const [currentWords, setCurrentWords] = useState<any[]>([]);
  const [currentScore, setCurrentScore] = useState(0);

  const [zoom, setZoom] = useState(1);
  const [viewAngle, setViewAngle] = useState(0);
  const [showJournal, setShowJournal] = useState(false);
  const [isExportingDeck, setIsExportingDeck] = useState(false);
  const [exportedDeckSuccess, setExportedDeckSuccess] = useState(false);
  const [loggedCompletion, setLoggedCompletion] = useState(false);

  // Initialize Projector Session State AND tag `currentQuestion.gameType = 'marble-scrabble'` so StudentClassView routes here!
  useEffect(() => {
    if (isProjector && !liveState?.gameStatus && onUpdateLiveState) {
      onUpdateLiveState({
        type: 'marble-scrabble',
        classId: resolvedClassId,
        currentQuestion: {
          ...(block || {}),
          gameType: 'marble-scrabble',
          title: block?.title || 'WordForge Live'
        },
        gameStatus: 'lobby_join',
        players: {},
        teams: {},
        board: Array(BOARD_SIZE * BOARD_SIZE).fill(null),
        bag: createBag(),
        scores: {},
        journals: {},
        racks: {},
        angles: {},
        latestDiscoveries: [],
        activeTeamIndex: 0,
        turnEndTime: null,
        isTimerPaused: false,
        remainingPausedTime: 0,
        isExtraTurn: false
      });
    }
  }, [isProjector, liveState?.gameStatus, onUpdateLiveState, resolvedClassId, block]);

  // Sync Global Board Changes to Local Board
  const globalBoardString = JSON.stringify(globalBoard);
  useEffect(() => {
    if (globalBoardString && globalBoardString !== 'undefined') {
      try {
        setLocalBoard(JSON.parse(globalBoardString));
        setPendingSentence(false);
        setSentenceText('');
        setSelectedRack(null);
        setInvalidWords([]);
        setCurrentWords([]);
      } catch {}
    }
  }, [globalBoardString]);

  // Recall any unsubmitted tiles if turn ends before commit
  useEffect(() => {
    if (!isProjector && !isMyTurn) {
      const nr = [...rack];
      const nb = [...localBoard];
      let changed = false;
      nb.forEach((tile, i) => {
        if (tile && !tile.isLocked) {
          const ei = nr.findIndex(t => t === null);
          if (ei !== -1) {
            nr[ei] = tile;
            nb[i] = null;
            changed = true;
          }
        }
      });
      if (changed) {
        setRack(nr);
        setLocalBoard(nb);
      }
      setSelectedRack(null);
    }
  }, [isMyTurn, isProjector]);

  // 🔥 FIXED RACK REPLENISHMENT: Syncs from `liveState.racks[myTeamId]` or draws missing tiles whenever a player's turn starts
  useEffect(() => {
    if (isProjector || !myTeamId || gameStatus !== 'playing') return;

    const serverRack = liveState?.racks?.[myTeamId];
    const localEmptyCount = rack.filter(t => t === null).length;

    // 1. If local rack is completely empty and server has our saved rack, restore it
    if (localEmptyCount === 7 && Array.isArray(serverRack) && serverRack.some(Boolean)) {
      setRack(serverRack);
      return;
    }

    // 2. If it's our turn and we have empty slots in our rack (and no unsubmitted tiles on the board), top up from globalBag
    const hasUnsubmittedOnBoard = localBoard.some(t => t && !t.isLocked);
    if (isMyTurn && !hasUnsubmittedOnBoard && localEmptyCount > 0 && Array.isArray(globalBag) && globalBag.length > 0) {
      const baseRack = Array.isArray(serverRack) && serverRack.some(Boolean) ? [...serverRack] : [...rack];
      const needsFill = baseRack.some(t => t === null);
      if (needsFill) {
        const newBag = [...globalBag];
        const filledRack = baseRack.map(slot => (slot === null && newBag.length > 0 ? newBag.pop() : slot));
        setRack(filledRack);
        onUpdateLiveState({
          bag: newBag,
          racks: { ...(liveState?.racks || {}), [myTeamId]: filledRack }
        });
      }
    }
  }, [isMyTurn, myTeamId, gameStatus, isProjector, liveState?.racks, globalBag]);

  const passTurn = useCallback(() => {
    if (teamArray.length === 0) return;
    onUpdateLiveState({
      activeTeamIndex: (activeTeamIndex + 1) % teamArray.length,
      turnEndTime: Date.now() + timeLimit * 1000,
      isExtraTurn: false,
      isTimerPaused: false
    });
  }, [teamArray.length, activeTeamIndex, timeLimit, onUpdateLiveState]);

  // Turn Countdown Timer
  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    if (isTimerPaused) {
      setTimeLeft(remainingPausedTime);
      return;
    }
    if (!turnEndTime) return;
    const iv = setInterval(() => {
      const rem = Math.max(0, Math.floor((turnEndTime - Date.now()) / 1000));
      setTimeLeft(rem);
      if (rem === 0 && isProjector && gameStatus === 'playing') {
        passTurn();
      }
    }, 500);
    return () => clearInterval(iv);
  }, [turnEndTime, isProjector, gameStatus, isTimerPaused, remainingPausedTime, passTurn]);

  // Auto-log XP & Completion when game finishes
  useEffect(() => {
    if (!isProjector && gameStatus === 'finished' && myTeamId && !loggedCompletion) {
      setLoggedCompletion(true);
      const earnedXp = Math.max(25, scores[myTeamId] || 0);
      const currentUser = auth?.currentUser;
      if (currentUser) {
        updateDoc(doc(db, 'artifacts', appId, 'users', currentUser.uid, 'profile', 'main'), {
          xp: increment(earnedXp)
        }).catch(() => {});
        addDoc(collection(db, 'artifacts', appId, 'activity_logs'), {
          studentName: myTeamEntry?.name || currentUser.email?.split('@')[0] || 'Scholar',
          studentEmail: currentUser.email,
          itemTitle: block?.title || 'WordForge Live Arena',
          itemId: block?.id || 'wordforge_session',
          xp: earnedXp,
          type: 'completion',
          activityType: 'arcade_game',
          timestamp: Date.now()
        }).catch(() => {});
      }
    }
  }, [gameStatus, isProjector, myTeamId, loggedCompletion, scores, myTeamEntry, block]);

  // Export discovered words to personal Scriptorium Flashcard Deck
  const handleExportJournalToDeck = async () => {
    if (!myJournal.length || isExportingDeck) return;
    setIsExportingDeck(true);
    try {
      const uid = auth?.currentUser?.uid || studentId || 'scholar';
      for (const entry of myJournal) {
        const cardId = `wf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await setDoc(doc(db, 'artifacts', appId, 'custom_cards', cardId), {
          id: cardId,
          deckId: 'custom',
          deckTitle: '✍️ Scriptorium (WordForge)',
          front: entry.word,
          term: entry.word,
          back: entry.def || 'Discovered in WordForge',
          definition: entry.def || 'Discovered in WordForge',
          ipa: entry.phonetic || '',
          type: entry.pos || 'vocabulary',
          mastery: 1,
          grammar_tags: [TIERS[entry.tier]?.label || 'WordForge'],
          instructorId: uid,
          createdAt: Date.now()
        });
      }
      setExportedDeckSuccess(true);
    } catch (e) {
      console.error('Failed to export WordForge journal:', e);
    } finally {
      setIsExportingDeck(false);
    }
  };

  // Transform helpers
  const activeAngle = liveAngles[activeTeam?.id] || 0;
  const getProjectorTransform = () => {
    if (activeAngle === 1) return 'rotateX(45deg) rotateZ(2.5deg)';
    if (activeAngle === 2) return 'rotateX(60deg) scale(0.9) rotateZ(2.5deg)';
    return 'rotateZ(2.5deg)';
  };

  const getTransform = () => {
    if (viewAngle === 1) return 'rotateX(45deg)';
    if (viewAngle === 2) return 'rotateX(60deg) scale(0.9)';
    return 'none';
  };

  const handleSetViewAngle = (angle: number) => {
    setViewAngle(angle);
    if (myTeamId && gameStatus === 'playing') {
      onUpdateLiveState({
        angles: { ...(liveState?.angles || {}), [myTeamId]: angle }
      });
    }
  };

  const joinLobby = () => {
    const rawId = String(studentId || auth?.currentUser?.email || `scholar_${Date.now()}`);
    const cleanName = rawId.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').trim() || 'Scholar';
    const display = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(rawId)}&backgroundColor=transparent`;
    onUpdateLiveState({
      players: { ...players, [studentId]: { id: studentId, name: display, avatar } }
    });
  };

  const startFFA = () => {
    const pIds = Object.keys(players);
    if (pIds.length === 0) return;
    const newTeams: any = {};
    const newScores: any = {};
    const newJournals: any = {};
    const newRacks: any = {};
    const newBag = [...(globalBag && globalBag.length > 0 ? globalBag : createBag())];

    pIds.forEach((pId, idx) => {
      const tId = `p_${idx}`;
      newTeams[tId] = {
        id: tId,
        order: idx,
        name: players[pId].name,
        avatar: players[pId].avatar,
        color: PLAYER_COLORS[idx % PLAYER_COLORS.length],
        members: [pId]
      };
      newScores[tId] = 0;
      newJournals[tId] = [];
      // Pre-deal 7 tiles to every player right when the match is configured!
      newRacks[tId] = Array(7)
        .fill(null)
        .map(() => (newBag.length > 0 ? newBag.pop() : null));
    });

    onUpdateLiveState({
      gameStatus: 'lobby_naming',
      teams: newTeams,
      scores: newScores,
      journals: newJournals,
      racks: newRacks,
      bag: newBag,
      timeLimit: selectedTime
    });
  };

  const startGame = () => {
    onUpdateLiveState({
      gameStatus: 'playing',
      turnEndTime: Date.now() + timeLimit * 1000
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
    const nr = [...rack];
    const nb = [...localBoard];
    nb.forEach((tile, i) => {
      if (tile && !tile.isLocked) {
        const ei = nr.findIndex(t => t === null);
        if (ei !== -1) {
          nr[ei] = tile;
          nb[i] = null;
        }
      }
    });
    setLocalBoard(nb);
    setRack(nr);
    setInvalidWords([]);
  };

  const shuffleRack = () => {
    const nr = [...rack];
    for (let i = nr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nr[i], nr[j]] = [nr[j], nr[i]];
    }
    setRack(nr);
    setSelectedRack(null);
  };

  const handlePurge = () => {
    if (!isMyTurn || isValidating || isTimerPaused || !myTeamId) return;
    if ((scores[myTeamId] || 0) < 10) return;

    const tilesToReturn: any[] = [];
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

    const newBag = [...(globalBag || []), ...tilesToReturn];
    for (let i = newBag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newBag[i], newBag[j]] = [newBag[j], newBag[i]];
    }

    const newRack = Array(7)
      .fill(null)
      .map(() => (newBag.length > 0 ? newBag.pop() : null));

    setRack(newRack);
    setLocalBoard(newBoard);
    setInvalidWords([]);
    setSelectedRack(null);

    const updatedScores = { ...scores, [myTeamId]: (scores[myTeamId] || 0) - 10 };
    onUpdateLiveState({
      bag: newBag,
      scores: updatedScores,
      activeTeamIndex: teamArray.length > 1 ? (activeTeamIndex + 1) % teamArray.length : 0,
      turnEndTime: Date.now() + timeLimit * 1000,
      isExtraTurn: false,
      isTimerPaused: false,
      racks: { ...(liveState?.racks || {}), [myTeamId]: newRack }
    });
  };

  const handleBoardClick = (idx: number) => {
    if (!isMyTurn || isValidating || isTimerPaused) return;
    setInvalidWords([]);
    if (localBoard[idx]?.isLocked) return;

    if (localBoard[idx] && !localBoard[idx].isLocked) {
      const ei = rack.findIndex(t => t === null);
      if (ei !== -1) {
        const nr = [...rack];
        const nb = [...localBoard];
        nr[ei] = nb[idx];
        nb[idx] = null;
        setRack(nr);
        setLocalBoard(nb);
      }
      return;
    }

    if (!localBoard[idx] && selectedRack !== null && rack[selectedRack]) {
      const nb = [...localBoard];
      const nr = [...rack];
      nb[idx] = { ...nr[selectedRack], isLocked: false };
      nr[selectedRack] = null;
      setLocalBoard(nb);
      setRack(nr);
      setSelectedRack(null);
    }
  };

  const handleRackClick = (idx: number) => {
    if (isValidating || isTimerPaused) return;
    setInvalidWords([]);
    if (!rack[idx]) return;

    if (selectedRack === null) {
      setSelectedRack(idx);
    } else if (selectedRack === idx) {
      setSelectedRack(null);
    } else {
      const nr = [...rack];
      [nr[idx], nr[selectedRack]] = [nr[selectedRack], nr[idx]];
      setRack(nr);
      setSelectedRack(null);
    }
  };

  const handleCommit = async () => {
    const placed = localBoard.reduce((acc: number[], t: any, i: number) => {
      if (t && !t.isLocked) acc.push(i);
      return acc;
    }, []);
    if (placed.length === 0) return;

    setIsValidating(true);
    setInvalidWords([]);

    const rows = [...new Set(placed.map(i => Math.floor(i / BOARD_SIZE)))];
    const cols = [...new Set(placed.map(i => i % BOARD_SIZE))];
    if (rows.length > 1 && cols.length > 1) {
      setInvalidWords(['Tiles must be placed in a single row or column.']);
      setIsValidating(false);
      return;
    }

    const getTile = (r: number, c: number) =>
      r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE ? localBoard[r * BOARD_SIZE + c] : null;

    let gap = false;
    if (rows.length === 1) {
      const r = rows[0];
      const mn = Math.min(...cols);
      const mx = Math.max(...cols);
      for (let c = mn; c <= mx; c++) if (!getTile(r, c)) gap = true;
    } else {
      const c = cols[0];
      const mn = Math.min(...rows);
      const mx = Math.max(...rows);
      for (let r = mn; r <= mx; r++) if (!getTile(r, c)) gap = true;
    }
    if (gap) {
      setInvalidWords(['No gaps allowed between placed tiles.']);
      setIsValidating(false);
      return;
    }

    const isFirst = !localBoard.some((t: any) => t?.isLocked);
    if (isFirst) {
      if (!placed.includes(112)) {
        setInvalidWords(['First word must cover the center star.']);
        setIsValidating(false);
        return;
      }
      if (placed.length < 2) {
        setInvalidWords(['First word must be at least 2 letters.']);
        setIsValidating(false);
        return;
      }
    } else {
      const touches = placed.some(idx => {
        const r = Math.floor(idx / BOARD_SIZE);
        const c = idx % BOARD_SIZE;
        return [[-1, 0], [1, 0], [0, -1], [0, 1]].some(([dr, dc]) => getTile(r + dr, c + dc)?.isLocked);
      });
      if (!touches) {
        setInvalidWords(['New tiles must connect to an existing word on the board.']);
        setIsValidating(false);
        return;
      }
    }

    const isHorizPlay = cols.length > 1 || placed.length === 1;
    const startIdx = placed[0];
    const rMain = Math.floor(startIdx / BOARD_SIZE);
    const cMain = startIdx % BOARD_SIZE;
    let startM = isHorizPlay ? cMain : rMain;
    while (startM > 0 && getTile(isHorizPlay ? rMain : startM - 1, isHorizPlay ? startM - 1 : cMain)) startM--;
    let endM = startM;
    while (endM < BOARD_SIZE - 1 && getTile(isHorizPlay ? rMain : endM + 1, isHorizPlay ? endM + 1 : cMain)) endM++;

    let mWord = '';
    let mRaw = 0;
    let mScored = 0;
    let mMult = 1;
    for (let i = startM; i <= endM; i++) {
      const t = getTile(isHorizPlay ? rMain : i, isHorizPlay ? i : cMain)!;
      mWord += t.letter;
      mRaw += t.value;
      let lv = t.value;
      if (!t.isLocked) {
        const sq = getSquareType(isHorizPlay ? rMain : i, isHorizPlay ? i : cMain);
        if (sq === 'DL') lv *= 2;
        if (sq === 'TL') lv *= 3;
        if (sq === 'DW' || sq === 'CT') mMult *= 2;
        if (sq === 'TW') mMult *= 3;
      }
      mScored += lv;
    }
    const mFinalScore = mScored * mMult;

    const adjWords = new Set<string>();
    for (let i = startM; i <= endM; i++) {
      const tr = isHorizPlay ? rMain : i;
      const tc = isHorizPlay ? i : cMain;
      const neighbors = isHorizPlay ? [[tr - 1, tc], [tr + 1, tc]] : [[tr, tc - 1], [tr, tc + 1]];
      neighbors.forEach(([nr, nc]) => {
        if (getTile(nr, nc)?.isLocked) {
          let nStart = isHorizPlay ? nc : nr;
          while (nStart > 0 && getTile(isHorizPlay ? nr : nStart - 1, isHorizPlay ? nStart - 1 : nc)) nStart--;
          let nEnd = nStart;
          while (nEnd < BOARD_SIZE - 1 && getTile(isHorizPlay ? nr : nEnd + 1, isHorizPlay ? nEnd + 1 : nc)) nEnd++;
          let adjW = '';
          for (let j = nStart; j <= nEnd; j++) adjW += getTile(isHorizPlay ? nr : j, isHorizPlay ? j : nc).letter;
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
          const rhymes = data.map((d: any) => d.word.toUpperCase());
          for (const w of adjWords) {
            if (rhymes.includes(w.toUpperCase())) {
              isStanza = true;
              break;
            }
          }
        }
      } catch {}
    }

    const wordList: { word: string; rawSum: number; finalScore: number; isStanza: boolean }[] = [];
    let totalScore = 0;

    if (isStanza) {
      wordList.push({ word: mWord, rawSum: mRaw, finalScore: mFinalScore * 2, isStanza: true });
      totalScore = mFinalScore * 2;
    } else {
      const seen = new Set<string>();
      placed.forEach(idx => {
        const r = Math.floor(idx / BOARD_SIZE);
        const c = idx % BOARD_SIZE;
        [[0, 1, 0], [1, 0, 1]].forEach(([dr, dc, axis]) => {
          let start = axis === 0 ? c : r;
          while (start > 0 && getTile(axis === 0 ? r : start - 1, axis === 0 ? start - 1 : c)) start--;
          let end = start;
          while (end < BOARD_SIZE - 1 && getTile(axis === 0 ? r : end + 1, axis === 0 ? end + 1 : c)) end++;
          if (end === start) return;
          const key = `${axis}-${axis === 0 ? r : c}-${start}-${end}`;
          if (seen.has(key)) return;
          seen.add(key);

          let word = '';
          let raw = 0;
          let scored = 0;
          let mult = 1;
          for (let i = start; i <= end; i++) {
            const t = getTile(axis === 0 ? r : i, axis === 0 ? i : c)!;
            word += t.letter;
            raw += t.value;
            let lv = t.value;
            if (!t.isLocked) {
              const sq = getSquareType(axis === 0 ? r : i, axis === 0 ? i : c);
              if (sq === 'DL') lv *= 2;
              if (sq === 'TL') lv *= 3;
              if (sq === 'DW' || sq === 'CT') mult *= 2;
              if (sq === 'TW') mult *= 3;
            }
            scored += lv;
          }
          const fs = scored * mult;
          wordList.push({ word, rawSum: raw, finalScore: fs, isStanza: false });
          totalScore += fs;
        });
      });
    }

    const validEntries: any[] = [];
    const failed: string[] = [];

    await Promise.all(
      wordList.map(async ({ word, rawSum, finalScore, isStanza: stanzaFlag }) => {
        if (word.length < 2) return;
        const upperW = word.toUpperCase();

        // 1. Check Custom Lesson Vocabulary & Classical Latin/Target-Language Seed Lexicon FIRST
        if (customLessonDictionary[upperW]) {
          const customMatch = customLessonDictionary[upperW];
          validEntries.push({
            word: upperW,
            tier: 6,
            finalScore: finalScore + 15,
            isStanza: stanzaFlag || false,
            def: customMatch.def,
            pos: customMatch.pos,
            phonetic: (customMatch as any).phonetic || null
          });
          totalScore += 15;
          return;
        }

        const tier = assignTier(word, rawSum, false);
        const entry: any = { word: upperW, tier, finalScore, isStanza: stanzaFlag || false };
        let found = false;

        // 2. Check English Dictionary API
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

        // 3. Fallback Datamuse Lexical Check
        if (!found) {
          try {
            const r2 = await fetch(`https://api.datamuse.com/words?sp=${word}&md=d&max=1`);
            const d2 = await r2.json();
            if (d2?.[0]?.word?.toLowerCase() === word.toLowerCase()) {
              entry.def = d2[0].defs?.[0]?.split('\t').pop() || 'Definition verified.';
              entry.pos = d2[0].defs?.[0]?.split('\t')[0] || null;
              found = true;
            }
          } catch {}
        }

        if (found) validEntries.push(entry);
        else failed.push(upperW);
      })
    );

    setIsValidating(false);
    if (failed.length > 0) {
      setInvalidWords(failed);
      return;
    }

    setCurrentWords(validEntries);
    setCurrentScore(totalScore);
    setPendingSentence(true);
  };

  const commitTurn = (withSentence: boolean) => {
    if (!myTeamId) return;
    const isStanzaBonus = currentWords.some(w => w.isStanza);
    let bonus = 0;
    let sentencePayload = null;
    let triggeredDP = false;

    localBoard.forEach((tile: any, idx: number) => {
      if (tile && !tile.isLocked) {
        const r = Math.floor(idx / BOARD_SIZE);
        const c = idx % BOARD_SIZE;
        if (getSquareType(r, c) === 'DP') triggeredDP = true;
      }
    });

    if (withSentence && sentenceText.trim().length > 5) {
      bonus = isStanzaBonus ? 10 : 5;
      sentencePayload = {
        playerName: myTeamEntry?.name || 'Scholar',
        text: sentenceText.trim(),
        bonusAmount: bonus,
        timestamp: Date.now()
      };
    }

    const lockedBoard = localBoard.map((t: any) => (t && !t.isLocked ? { ...t, isLocked: true } : t));
    const updatedScores = { ...scores, [myTeamId]: (scores[myTeamId] || 0) + currentScore + bonus };
    const updatedJournals = { ...journals, [myTeamId]: [...(journals[myTeamId] || []), ...currentWords] };

    const newBag = [...(globalBag || [])];
    const newRack = rack.map((s: any) => (s === null && newBag.length > 0 ? newBag.pop() : s));
    setRack(newRack);

    const payload: any = {
      board: lockedBoard,
      scores: updatedScores,
      journals: updatedJournals,
      racks: { ...(liveState?.racks || {}), [myTeamId]: newRack }, // 🔥 Persists replenished rack to Firestore
      latestDiscoveries: currentWords,
      bag: newBag,
      latestSentence: sentencePayload || null,
      activeTeamIndex: triggeredDP ? activeTeamIndex : (activeTeamIndex + 1) % Math.max(1, teamArray.length),
      turnEndTime: Date.now() + timeLimit * 1000,
      isExtraTurn: triggeredDP,
      isTimerPaused: false
    };

    onUpdateLiveState(payload);
    setPendingSentence(false);
    setSentenceText('');
    setCurrentWords([]);
    setCurrentScore(0);
  };

  // ─────────────────────────────────────────────
  // PROJECTOR VIEWS
  // ─────────────────────────────────────────────
  if (isProjector) {
    const bg = { background: 'radial-gradient(circle at center, #1e1b4b 0%, #08090f 80%)', minHeight: '100%' };

    if (!gameStatus || gameStatus === 'lobby_join') {
      return (
        <div
          className="wf-root"
          style={{
            ...bg,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 48,
            color: '#f8fafc',
            minHeight: '100vh'
          }}
        >
          <div
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 72,
              lineHeight: 1,
              marginBottom: 12,
              background: 'linear-gradient(135deg,#f8fafc,#94a3b8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            WordForge
          </div>
          <div className="px-4 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-black uppercase tracking-widest mb-10">
            Room Code: {String(resolvedClassId).substring(0, 6).toUpperCase()} • Students Join via Class "LIVE" Banner
          </div>

          <div style={{ display: 'flex', gap: 64, alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: 1100 }}>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <SmartboardQRCode classId={resolvedClassId} />
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 28, color: 'rgba(255,255,255,0.9)', marginBottom: 40, fontWeight: 700 }}>
                <div style={{ background: 'rgba(74,222,128,0.15)', padding: 12, borderRadius: 16, border: '1px solid rgba(74,222,128,0.3)' }}>
                  <Users size={36} style={{ color: '#4ade80' }} />
                </div>
                {Object.keys(players).length} operative{Object.keys(players).length !== 1 ? 's' : ''} connected
              </div>

              <div style={{ marginBottom: 48 }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16, fontWeight: 700 }}>
                  Select Turn Duration
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {[
                    { l: '1 min', v: 60 },
                    { l: '90 sec', v: 90 },
                    { l: '2 min', v: 120 },
                    { l: '5 min', v: 300 }
                  ].map(t => (
                    <button
                      key={t.v}
                      onClick={() => setSelectedTime(t.v)}
                      style={{
                        padding: '12px 24px',
                        borderRadius: 12,
                        fontWeight: 700,
                        fontSize: 15,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: selectedTime === t.v ? 'rgba(79,70,229,0.25)' : 'rgba(255,255,255,0.04)',
                        border: selectedTime === t.v ? '1px solid rgba(79,70,229,0.6)' : '1px solid rgba(255,255,255,0.1)',
                        color: selectedTime === t.v ? '#a5b4fc' : 'rgba(255,255,255,0.4)'
                      }}
                    >
                      {t.l}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={startFFA}
                disabled={Object.keys(players).length < 1}
                style={{
                  padding: '20px 48px',
                  borderRadius: 16,
                  fontSize: 22,
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: Object.keys(players).length < 1 ? 'rgba(255,255,255,0.05)' : 'rgba(79,70,229,0.9)',
                  border: Object.keys(players).length < 1 ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(99,102,241,1)',
                  color: Object.keys(players).length < 1 ? 'rgba(255,255,255,0.3)' : '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  transition: 'all 0.3s',
                  boxShadow: Object.keys(players).length < 1 ? 'none' : '0 15px 40px rgba(79,70,229,0.5)'
                }}
              >
                <Rocket size={26} /> Begin Sequence
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (gameStatus === 'lobby_naming') {
      return (
        <div className="wf-root" style={{ ...bg, display: 'flex', flexDirection: 'column', padding: 40, color: '#f8fafc', minHeight: '100vh' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
            <div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 40, color: '#f8fafc' }}>Ready to forge words?</div>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 4 }}>Confirm your callsign on your device</p>
            </div>
            <button
              onClick={startGame}
              style={{
                padding: '12px 28px',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                background: 'rgba(74,222,128,0.15)',
                border: '1px solid rgba(74,222,128,0.4)',
                color: '#4ade80',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <CheckCircle2 size={18} /> Start Game
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {teamArray.map((t: any) => (
              <div
                key={t.id}
                style={{
                  padding: '24px 28px',
                  borderRadius: 16,
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${t.color.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  minWidth: 200
                }}
              >
                {t.avatar && <img src={t.avatar} alt={t.name} style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />}
                <div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: '#f8fafc' }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Ready</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (gameStatus === 'finished') {
      const sorted = [...teamArray].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
      return (
        <div className="wf-root" style={{ ...bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48, color: '#f8fafc', overflowY: 'auto', minHeight: '100vh' }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 52, marginBottom: 48, color: '#f8fafc' }}>Session Complete</div>
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end' }}>
            {sorted.slice(0, 3).map((t: any, i: number) => (
              <div key={t.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {i === 0 && <Trophy size={32} style={{ color: '#f59e0b', marginBottom: 8 }} />}
                {t.avatar && (
                  <img
                    src={t.avatar}
                    alt={t.name}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      border: `3px solid ${i === 0 ? '#f59e0b' : t.color.bg}`,
                      background: 'rgba(255,255,255,0.05)',
                      marginBottom: 12
                    }}
                  />
                )}
                <div style={{ padding: '20px 28px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', width: 160, height: 180 - i * 30 }}>
                  <div style={{ color: t.color.bg, fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{t.name}</div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 42 }}>{scores[t.id] || 0}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                    {(journals[t.id] || []).length} words found
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 48, maxWidth: 800, width: '100%' }}>
            <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>
              Vocabulary Discovered This Session
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {sorted.map((t: any) =>
                (journals[t.id] || []).map((e: any, i: number) => {
                  const tier = TIERS[e.tier] || TIERS[2];
                  return (
                    <span
                      key={`${t.id}-${i}`}
                      style={{
                        padding: '3px 10px',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 600,
                        background: tier.bg,
                        border: `1px solid ${tier.border}`,
                        color: tier.color
                      }}
                    >
                      {e.word}
                    </span>
                  );
                })
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="wf-root" style={{ ...bg, position: 'relative', overflow: 'hidden', height: '100vh', width: '100vw' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 0, perspective: '1200px' }}>
          <div className="animate-float" style={{ background: 'rgba(255,255,255,0.01)', borderRadius: 16, padding: 10, border: '1px solid rgba(255,255,255,0.03)' }}>
            <div
              className="wf-board"
              style={{
                width: 720,
                height: 720,
                transformStyle: 'preserve-3d',
                transformOrigin: 'center center',
                transform: getProjectorTransform(),
                transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {(globalBoard || []).map((tile: any, i: number) => {
                const r = Math.floor(i / BOARD_SIZE);
                const c = i % BOARD_SIZE;
                const type = getSquareType(r, c);
                return (
                  <div key={i} style={{ ...squareStyle(r, c, false), display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {!tile && type === 'CT' && <Star size={14} style={{ color: 'rgba(79,70,229,0.5)' }} fill="currentColor" />}
                    {!tile && type === 'TW' && <span style={{ fontSize: 7, fontWeight: 700, color: 'rgba(220,38,38,0.6)', textTransform: 'uppercase' }}>3W</span>}
                    {!tile && type === 'DW' && <span style={{ fontSize: 7, fontWeight: 700, color: 'rgba(217,119,6,0.6)', textTransform: 'uppercase' }}>2W</span>}
                    {!tile && type === 'TL' && <span style={{ fontSize: 7, fontWeight: 700, color: 'rgba(8,145,178,0.6)', textTransform: 'uppercase' }}>3L</span>}
                    {!tile && type === 'DL' && <span style={{ fontSize: 7, fontWeight: 700, color: 'rgba(5,150,105,0.6)', textTransform: 'uppercase' }}>2L</span>}
                    {!tile && type === 'DP' && <FastForward size={14} style={{ color: 'rgba(217,70,239,0.5)' }} fill="currentColor" />}
                    {tile && <Tile tile={tile} locked size="sm" isBoardTile />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Left Turn & Timer Indicator */}
        <div style={{ position: 'absolute', top: 24, left: 24, zIndex: 10, display: 'flex', gap: 12 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 20px',
              backdropFilter: 'blur(12px)',
              borderRadius: 30,
              background: 'rgba(15, 23, 42, 0.6)',
              border: `1px solid ${activeTeam?.color?.border || 'rgba(255,255,255,0.1)'}`
            }}
          >
            {activeTeam?.avatar && <img src={activeTeam.avatar} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />}
            <span style={{ fontWeight: 600, color: activeTeam?.color?.bg || '#f8fafc', fontSize: 14 }}>{activeTeam?.name || '—'}</span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>is playing</span>
            {isExtraTurn && (
              <span style={{ background: '#d946ef', color: 'white', fontSize: 10, padding: '2px 6px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
                <FastForward size={10} /> DOUBLE PLAY
              </span>
            )}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              backdropFilter: 'blur(12px)',
              borderRadius: 30,
              background: isTimerPaused ? 'rgba(217,119,6,0.3)' : 'rgba(15, 23, 42, 0.6)',
              border: isTimerPaused ? '1px solid rgba(217,119,6,0.5)' : '1px solid rgba(255,255,255,0.1)'
            }}
          >
            {isTimerPaused ? <Pause size={14} style={{ color: '#f59e0b' }} /> : <Clock size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />}
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: isTimerPaused ? '#f59e0b' : '#f8fafc', fontSize: 16 }}>
              {isTimerPaused ? 'PAUSED' : `${timeLeft}s`}
            </span>
          </div>
        </div>

        {/* Bottom Left Host Controls */}
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: 24,
            display: 'flex',
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            overflow: 'hidden',
            backdropFilter: 'blur(12px)',
            zIndex: 10
          }}
        >
          <div style={{ padding: '10px 14px', background: 'rgba(79,70,229,0.15)', borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center' }}>
            <ShieldAlert size={16} style={{ color: 'rgba(79,70,229,0.9)' }} />
          </div>
          {[
            { icon: isTimerPaused ? <Play size={14} /> : <Pause size={14} />, label: isTimerPaused ? 'Resume' : 'Pause', action: togglePause, color: '#f59e0b' },
            { icon: <FastForward size={14} />, label: 'Skip turn', action: passTurn, color: 'rgba(255,255,255,0.6)' },
            { icon: <Power size={14} />, label: 'End game', action: forceEnd, color: '#ef4444' }
          ].map((btn, i) => (
            <button
              key={i}
              onClick={btn.action}
              style={{
                padding: '10px 16px',
                background: 'transparent',
                border: 'none',
                borderRight: '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: btn.color,
                fontSize: 12,
                fontWeight: 600
              }}
            >
              {btn.icon}
              {btn.label}
            </button>
          ))}
        </div>

        {/* Right Leaderboard & Live Word Feed */}
        <div style={{ position: 'absolute', top: 24, right: 24, bottom: 24, width: 360, display: 'flex', flexDirection: 'column', gap: 16, zIndex: 10, overflowY: 'auto' }} className="wf-scroll">
          {latestDiscoveries.some((e: any) => e.isStanza) && (
            <div style={{ background: 'rgba(217,70,239,0.2)', backdropFilter: 'blur(12px)', border: '1px solid rgba(217,70,239,0.5)', borderRadius: 16, padding: 16, textAlign: 'center', boxShadow: '0 0 20px rgba(217,70,239,0.3)' }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#f8fafc', letterSpacing: 2, textShadow: '0 0 10px #d946ef' }}>STANZA STACK (2X)</span>
            </div>
          )}

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <Trophy size={16} style={{ color: '#f59e0b' }} />
              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: '#f8fafc' }}>Scores</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 6 }}>
                {globalBag?.length || 0} tiles left
              </span>
            </div>
            {teamArray.map((t: any, idx: number) => {
              const isActive = idx === activeTeamIndex;
              const myWords = journals[t.id] || [];
              const teamRack = liveRacks[t.id] || [];
              return (
                <div
                  key={t.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 10,
                    marginBottom: 8,
                    transition: 'all 0.2s',
                    background: isActive ? t.color.muted : 'rgba(255,255,255,0.02)',
                    border: isActive ? `1px solid ${t.color.border}` : '1px solid transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: myWords.length > 0 || teamRack.length > 0 ? 8 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {t.avatar && <img src={t.avatar} alt="" style={{ width: 28, height: 28, borderRadius: '50%', opacity: isActive ? 1 : 0.6 }} />}
                      <span style={{ fontSize: 14, fontWeight: 600, color: isActive ? t.color.bg : 'rgba(255,255,255,0.6)' }}>{t.name}</span>
                    </div>
                    <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: isActive ? '#f8fafc' : 'rgba(255,255,255,0.5)' }}>
                      {scores[t.id] || 0}
                    </span>
                  </div>

                  {teamRack.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, marginTop: 12, justifyContent: 'center' }}>
                      {teamRack.map((rt: any, ri: number) => (
                        <div
                          key={ri}
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 4,
                            background: rt ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.02)',
                            border: rt ? '1px solid rgba(255,255,255,0.3)' : '1px dashed rgba(255,255,255,0.1)'
                          }}
                        >
                          {rt && <Tile tile={rt} size="sm" isSolid />}
                        </div>
                      ))}
                    </div>
                  )}

                  {myWords.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 12 }}>
                      {myWords.slice(-8).map((e: any, i: number) => {
                        const tier = TIERS[e.tier] || TIERS[2];
                        return (
                          <span
                            key={i}
                            style={{
                              fontSize: 9,
                              padding: '2px 7px',
                              borderRadius: 10,
                              background: tier.bg,
                              border: `1px solid ${tier.border}`,
                              color: tier.color,
                              fontWeight: 600
                            }}
                          >
                            {e.word}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {latestDiscoveries.length > 0 && (
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <BookOpen size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />
                <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, color: 'rgba(255,255,255,0.4)' }}>Words Played</span>
              </div>
              {latestDiscoveries.map((e: any, i: number) => (
                <WordCard key={i} entry={e} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // STUDENT VIEWS
  // ─────────────────────────────────────────────
  const bg = { background: 'radial-gradient(circle at center, #1e1b4b 0%, #08090f 100%)', minHeight: '100%' };

  if (!gameStatus || gameStatus === 'lobby_join') {
    const joined = Boolean(players[studentId]);
    return (
      <div className="wf-root wf-scroll" style={{ ...bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center', color: '#f8fafc', minHeight: '100%' }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 42, marginBottom: 6 }}>WordForge</div>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 40 }}>
          Vocabulary Discovery Arena
        </p>
        {joined ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={32} style={{ color: '#4ade80' }} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc' }}>You are connected!</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', letterSpacing: 2, textTransform: 'uppercase' }}>
              Waiting for instructor to start the match...
            </p>
          </div>
        ) : (
          <button
            onClick={joinLobby}
            style={{
              padding: '16px 40px',
              borderRadius: 14,
              fontSize: 17,
              fontWeight: 600,
              cursor: 'pointer',
              background: 'rgba(79,70,229,0.25)',
              border: '1px solid rgba(79,70,229,0.6)',
              color: '#a5b4fc',
              transition: 'all 0.15s'
            }}
          >
            Join Session
          </button>
        )}
      </div>
    );
  }

  if (gameStatus === 'lobby_naming') {
    if (!myTeamEntry) {
      return (
        <div className="wf-root wf-scroll" style={{ ...bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
          Spectator mode
        </div>
      );
    }

    const teamColor = myTeamEntry.color?.bg || '#4f46e5';
    const teamMuted = myTeamEntry.color?.muted || 'rgba(79,70,229,0.15)';

    return (
      <div className="wf-root wf-scroll" style={{ ...bg, display: 'flex', flexDirection: 'column', padding: 24, color: '#f8fafc', minHeight: '100vh' }}>
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, margin: 0, color: '#f8fafc' }}>Identify Operative</h2>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 2, marginTop: 4 }}>
            Configure your callsign
          </p>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              width: '100%',
              maxWidth: 340,
              background: 'linear-gradient(145deg, rgba(30,41,59,0.8), rgba(15,23,42,0.95))',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 24,
              padding: 32,
              boxShadow: `0 20px 40px rgba(0,0,0,0.6), inset 0 0 30px ${teamMuted}`,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 6, background: teamColor, boxShadow: `0 0 10px ${teamColor}` }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
              <div style={{ width: 80, height: 80, borderRadius: 16, background: 'rgba(0,0,0,0.3)', border: `1px solid ${myTeamEntry.color?.border}`, padding: 4 }}>
                {myTeamEntry.avatar && <img src={myTeamEntry.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: 12 }} />}
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 2, display: 'block', marginBottom: 4 }}>
                  Uplink Status
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', background: 'rgba(74,222,128,0.1)', padding: '4px 8px', borderRadius: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80' }} className="animate-pulse" />
                  SECURE
                </span>
              </div>
            </div>

            <div style={{ marginBottom: 32 }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 2, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <User size={12} /> Operative Name
              </span>
              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, color: '#f8fafc', lineHeight: 1 }}>
                {myTeamEntry.name}
              </span>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
              <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 2, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <PenTool size={12} /> Edit Callsign
              </label>
              <input
                defaultValue={myTeamEntry.name}
                onBlur={e => {
                  const v = e.target.value.trim();
                  if (v && myTeamId) {
                    const upd = { ...teams, [myTeamId]: { ...teams[myTeamId], name: v } };
                    onUpdateLiveState({ teams: upd });
                  }
                }}
                maxLength={15}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `2px solid ${teamColor}`,
                  color: '#f8fafc',
                  fontSize: 20,
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 700,
                  outline: 'none',
                  padding: '4px 0'
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <Loader2 size={24} className="animate-spin" style={{ color: teamColor }} />
            <p style={{ color: teamColor, fontSize: 11, textTransform: 'uppercase', letterSpacing: 3, fontWeight: 700 }}>
              Awaiting Host Authorization
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (gameStatus === 'finished') {
    const myScore = scores[myTeamId] || 0;
    const sorted = [...teamArray].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
    const rank = sorted.findIndex((t: any) => t.id === myTeamId) + 1;
    return (
      <div className="wf-root wf-scroll" style={{ ...bg, display: 'flex', flexDirection: 'column', padding: 24, color: '#f8fafc', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32 }}>Session Complete</div>
          {myJournal.length > 0 && (
            <button
              type="button"
              disabled={isExportingDeck || exportedDeckSuccess}
              onClick={handleExportJournalToDeck}
              style={{
                background: exportedDeckSuccess ? 'rgba(22,163,74,0.2)' : 'rgba(79,70,229,0.25)',
                border: exportedDeckSuccess ? '1px solid rgba(22,163,74,0.5)' : '1px solid rgba(79,70,229,0.5)',
                borderRadius: 10,
                color: exportedDeckSuccess ? '#4ade80' : '#a5b4fc',
                padding: '8px 14px',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              {exportedDeckSuccess ? <><Check size={14} /> Saved to Flashcards</> : <><BookmarkPlus size={14} /> Save Words to My Deck</>}
            </button>
          )}
        </div>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginBottom: 24 }}>
          Your score has been synced to your class gradebook!
        </p>
        <div style={{ padding: 24, borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 56, lineHeight: 1 }}>{myScore}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 2, marginTop: 4 }}>
            points · Rank #{rank}
          </div>
        </div>
        {myJournal.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>
              Your Word Journal ({myJournal.length} words)
            </p>
            {myJournal.map((e: any, i: number) => (
              <WordCard key={i} entry={e} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (isMyTurn && pendingSentence) {
    const isStanzaBonus = currentWords.some(w => w.isStanza);
    return (
      <div className="wf-root wf-scroll" style={{ ...bg, display: 'flex', flexDirection: 'column', padding: 24, color: '#f8fafc', overflowY: 'auto', position: 'relative', zIndex: 100 }}>
        {isStanzaBonus && (
          <div style={{ background: 'rgba(217,70,239,0.15)', border: '1px solid rgba(217,70,239,0.4)', borderRadius: 12, padding: 12, textAlign: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: '#f8fafc', letterSpacing: 2 }}>STANZA STACK (2X)</span>
          </div>
        )}
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, marginBottom: 4 }}>Words Forged!</div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 20 }}>
          {isStanzaBonus
            ? 'Write a rhyming couplet using your word at the end of the first line to earn +10 points.'
            : 'Earn +5 bonus points by writing a contextual sentence using one of your forged words.'}
        </p>
        <div style={{ marginBottom: 20 }}>
          {currentWords.map((e, i) => (
            <WordCard key={i} entry={e} />
          ))}
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, border: '1px solid rgba(255,255,255,0.08)', marginBottom: 16 }}>
          <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: 10 }}>
            {isStanzaBonus ? 'Write your Rhyming Couplet' : 'Write your sentence'}
          </label>
          <textarea
            value={sentenceText}
            onChange={e => setSentenceText(e.target.value)}
            placeholder={isStanzaBonus ? 'Line 1 ends with your word...\nLine 2 ends with a rhyme...' : 'e.g. The ancient forum was the heart of Roman civic life...'}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10,
              padding: '12px 14px',
              color: '#f8fafc',
              fontSize: 14,
              fontFamily: "'DM Sans', sans-serif",
              outline: 'none',
              resize: 'vertical',
              minHeight: 100,
              boxSizing: 'border-box',
              lineHeight: 1.6
            }}
          />
        </div>
        <button
          onClick={() => commitTurn(true)}
          disabled={sentenceText.trim().length < 6}
          style={{
            padding: '13px 20px',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            background: sentenceText.trim().length >= 6 ? 'rgba(245,208,90,0.15)' : 'rgba(255,255,255,0.04)',
            border: sentenceText.trim().length >= 6 ? '1px solid rgba(245,208,90,0.4)' : '1px solid rgba(255,255,255,0.08)',
            color: sentenceText.trim().length >= 6 ? '#f5d05a' : 'rgba(255,255,255,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 8
          }}
        >
          <MessageSquare size={16} /> Submit with bonus (+{isStanzaBonus ? '10' : '5'})
        </button>
        <button
          onClick={() => commitTurn(false)}
          style={{
            padding: '13px 20px',
            borderRadius: 12,
            fontSize: 13,
            cursor: 'pointer',
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.35)',
            fontWeight: 500
          }}
        >
          Skip bonus, play word
        </button>
      </div>
    );
  }

  return (
    <div className="wf-root" style={{ ...bg, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
      {showJournal && (
        <JournalPanel
          words={myJournal}
          onClose={() => setShowJournal(false)}
          onExportToDeck={handleExportJournalToDeck}
          isExporting={isExportingDeck}
          exportedSuccess={exportedDeckSuccess}
        />
      )}

      {/* Floating Header */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          right: 10,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderRadius: 12,
          backdropFilter: 'blur(12px)',
          background: isMyTurn ? 'rgba(79,70,229,0.3)' : 'rgba(15, 23, 42, 0.6)',
          border: isMyTurn ? '1px solid rgba(79,70,229,0.5)' : '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isTimerPaused ? <Pause size={13} style={{ color: '#f59e0b' }} /> : <Clock size={13} style={{ color: 'rgba(255,255,255,0.4)' }} />}
          <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: isTimerPaused ? '#f59e0b' : isMyTurn ? '#fff' : 'rgba(255,255,255,0.6)' }}>
            {isTimerPaused ? 'Paused' : `${timeLeft}s`}
          </span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: isMyTurn ? '#fff' : 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 6 }}>
          {isExtraTurn && isMyTurn && <FastForward size={12} style={{ color: '#d946ef' }} />}
          {isMyTurn ? 'Your turn' : `${activeTeam?.name || 'Operative'}'s turn`}
        </span>
        <button
          onClick={() => setShowJournal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 10px',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            cursor: 'pointer',
            color: '#fff',
            fontSize: 11,
            fontWeight: 600
          }}
        >
          <BookOpen size={12} /> Journal {myJournal.length > 0 && `(${myJournal.length})`}
        </button>
      </div>

      {/* Full Background Board */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'auto', zIndex: 1, perspective: '1200px', paddingTop: 80, paddingBottom: 220 }} className="wf-scroll">
        <div
          style={{
            position: 'fixed',
            top: 70,
            right: 10,
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(12px)',
            borderRadius: 10,
            overflow: 'hidden',
            width: 32,
            boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
          }}
        >
          {[
            { icon: <Layers size={14} />, fn: () => handleSetViewAngle((viewAngle + 1) % 3) },
            { icon: <ZoomIn size={14} />, fn: () => setZoom(p => Math.min(p + 0.2, 2.0)) },
            { icon: <LocateFixed size={14} />, fn: () => { setZoom(1); handleSetViewAngle(0); } },
            { icon: <ZoomOut size={14} />, fn: () => setZoom(p => Math.max(p - 0.2, 0.5)) }
          ].map((b, i) => (
            <button
              key={i}
              onClick={b.fn}
              style={{
                width: 32,
                height: 30,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.1)' : undefined,
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.6)'
              }}
            >
              {b.icon}
            </button>
          ))}
        </div>

        <div style={{ transformOrigin: 'top left', transform: `scale(${zoom})`, width: `${720 * zoom}px`, height: `${720 * zoom}px`, margin: '0 auto' }}>
          <div
            className="wf-board animate-float"
            style={{
              width: 720,
              height: 720,
              padding: 8,
              boxSizing: 'border-box',
              transformStyle: 'preserve-3d',
              transform: `${getTransform()} rotateZ(2.5deg)`,
              transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {(localBoard || []).map((tile: any, idx: number) => {
              const r = Math.floor(idx / BOARD_SIZE);
              const c = idx % BOARD_SIZE;
              const type = getSquareType(r, c);
              return (
                <div
                  key={idx}
                  onClick={() => handleBoardClick(idx)}
                  style={{
                    ...squareStyle(r, c, false),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    cursor: isMyTurn && !tile?.isLocked ? 'pointer' : 'default'
                  }}
                >
                  {!tile && type === 'CT' && <Star size={10} style={{ color: 'rgba(79,70,229,0.4)' }} fill="currentColor" />}
                  {!tile && type === 'TW' && <span style={{ fontSize: 6, fontWeight: 700, color: 'rgba(220,38,38,0.5)', textTransform: 'uppercase' }}>3W</span>}
                  {!tile && type === 'DW' && <span style={{ fontSize: 6, fontWeight: 700, color: 'rgba(217,119,6,0.5)', textTransform: 'uppercase' }}>2W</span>}
                  {!tile && type === 'TL' && <span style={{ fontSize: 6, fontWeight: 700, color: 'rgba(8,145,178,0.5)', textTransform: 'uppercase' }}>3L</span>}
                  {!tile && type === 'DL' && <span style={{ fontSize: 6, fontWeight: 700, color: 'rgba(5,150,105,0.5)', textTransform: 'uppercase' }}>2L</span>}
                  {!tile && type === 'DP' && <FastForward size={14} style={{ color: 'rgba(217,70,239,0.5)' }} fill="currentColor" />}
                  {tile && <Tile tile={tile} locked={tile.isLocked} size="sm" isBoardTile={viewAngle > 0} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Rack & Action Controls */}
      <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10, zIndex: 50, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {invalidWords.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: 'rgba(220,38,38,0.85)', border: '1px solid rgba(220,38,38,1)', backdropFilter: 'blur(12px)', fontSize: 12, color: '#fff' }}>
            <AlertTriangle size={13} /> {invalidWords.join(', ')} — not recognized
          </div>
        )}

        <div style={{ background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '10px 12px', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, color: isMyTurn ? 'rgba(165,180,252,0.9)' : 'rgba(255,255,255,0.5)' }}>
              {isTimerPaused
                ? 'Paused by instructor'
                : isMyTurn
                ? selectedRack !== null
                  ? 'Tap an empty board square to place'
                  : 'Select a tile from your rack'
                : 'Standby — watching board...'}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={handlePurge}
                disabled={!isMyTurn || isValidating || isTimerPaused || (scores[myTeamId] || 0) < 10}
                title="Purge Hand (-10 XP)"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background: 'rgba(244,63,94,0.2)',
                  border: '1px solid rgba(244,63,94,0.4)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fb7185',
                  opacity: !isMyTurn || isValidating || isTimerPaused || (scores[myTeamId] || 0) < 10 ? 0.3 : 1
                }}
              >
                <RefreshCw size={13} />
              </button>
              <button
                onClick={shuffleRack}
                disabled={isTimerPaused}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  opacity: isTimerPaused ? 0.3 : 1
                }}
              >
                <Shuffle size={13} />
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', minHeight: 44 }}>
            {rack.map((tile: any, i: number) => (
              <div
                key={i}
                onClick={() => handleRackClick(i)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: tile ? undefined : 'rgba(255,255,255,0.05)',
                  border: tile ? undefined : '1px dashed rgba(255,255,255,0.2)',
                  opacity: isTimerPaused ? 0.4 : 1
                }}
              >
                {tile && <Tile tile={tile} selected={selectedRack === i} size="md" isSolid />}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={recallAll}
            disabled={isValidating || isTimerPaused}
            style={{
              flex: 1,
              padding: '12px 0',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              opacity: isValidating || isTimerPaused ? 0.4 : 1
            }}
          >
            <ArrowDownToLine size={14} /> Recall
          </button>
          {isMyTurn ? (
            <button
              onClick={handleCommit}
              disabled={isValidating || isTimerPaused}
              style={{
                flex: 2,
                padding: '12px 0',
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                background: 'rgba(79,70,229,0.85)',
                border: '1px solid rgba(99,102,241,1)',
                backdropFilter: 'blur(12px)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                opacity: isValidating || isTimerPaused ? 0.5 : 1
              }}
            >
              {isValidating ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Checking...
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} /> Play Word
                </>
              )}
            </button>
          ) : (
            <div
              style={{
                flex: 2,
                padding: '12px 0',
                borderRadius: 12,
                fontSize: 12,
                textAlign: 'center',
                color: 'rgba(255,255,255,0.45)',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(12px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              Standby...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
