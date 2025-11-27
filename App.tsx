import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  onSnapshot, 
  collection, 
  addDoc, 
  updateDoc, 
  increment,
  writeBatch,
  deleteDoc,
  arrayUnion,
  query,
  where,
  collectionGroup
} from "firebase/firestore";
import { 
  BookOpen, 
  Layers, 
  User, 
  Home, 
  Check, 
  X, 
  Zap, 
  ChevronRight, 
  Search, 
  Volume2, 
  Puzzle, 
  MessageSquare, 
  GraduationCap, 
  PlusCircle, 
  Save, 
  Feather, 
  ChevronDown, 
  PlayCircle, 
  Award, 
  Trash2, 
  Plus, 
  FileText, 
  Brain,
  Loader,
  LogOut,
  Mail,
  Lock,
  UploadCloud,
  Database,
  School,
  Users,
  Copy,
  List,
  ArrowRight,
  LayoutDashboard,
  ArrowLeft,
  Library,
  Eye,
  AlignLeft,
  HelpCircle,
  Pencil,
  Image,
  Info,
  Edit3,
  TrendingUp,
  Activity,
  Calendar,
  FileJson,
  AlertTriangle,
  FlipVertical,
  Dice5,
  GanttChart,
  Club
} from 'lucide-react';

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyAjK79x_N5pSWzWluFUg25mqEc_HeraRPk",
  authDomain: "epic-latin.firebaseapp.com",
  projectId: "epic-latin",
  storageBucket: "epic-latin.firebasestorage.app",
  messagingSenderId: "321050459278",
  appId: "1:321050459278:web:df00b3cf5b8befb0d55ddf",
  measurementId: "G-KEWLZ67Z61"
};

const app = initializeApp(firebaseConfig);
// eslint-disable-next-line no-unused-vars
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
// @ts-ignore
const appId = typeof __app_id !== 'undefined' ? __app_id : 'epic-latin-prod';

// --- DEFAULTS ---
const DEFAULT_USER_DATA = {
  name: "Discipulus",
  targetLanguage: "Latin",
  level: "Novice",
  streak: 1,
  xp: 0,
  role: 'student'
};

// --- SEED DATA ---
const INITIAL_SYSTEM_DECKS = {
  salutationes: {
    title: "👋 Salutationes",
    cards: [
      { id: 's1', front: "Salve", back: "Hello (Singular)", ipa: "/ˈsal.weː/", type: "phrase", mastery: 4, morphology: [{ part: "Salv-", meaning: "Health", type: "root" }, { part: "-e", meaning: "Imp. Sing.", type: "suffix" }], usage: { sentence: "Salve, Marce!", translation: "Hello, Marcus!" }, grammar_tags: ["Imperative", "Greeting"] },
      { id: 's2', front: "Salvete", back: "Hello (Plural)", ipa: "/salˈweː.te/", type: "phrase", mastery: 3, morphology: [{ part: "Salv-", meaning: "Health", type: "root" }, { part: "-ete", meaning: "Imp. Pl.", type: "suffix" }], usage: { sentence: "Salvete, discipuli!", translation: "Hello, students!" }, grammar_tags: ["Imperative", "Greeting"] },
      { id: 's3', front: "Vale", back: "Goodbye", ipa: "/ˈwa.leː/", type: "phrase", mastery: 3, morphology: [{ part: "Val-", meaning: "Be strong", type: "root" }, { part: "-e", meaning: "Imp.", type: "suffix" }], usage: { sentence: "Vale, amice.", translation: "Goodbye, friend." }, grammar_tags: ["Valediction"] }
    ]
  },
  medicina: {
    title: "⚕️ Medicina",
    cards: [
      { id: 'm1', front: "Vulnus", back: "Wound", ipa: "/ˈwul.nus/", type: "noun", mastery: 1, morphology: [{ part: "Vuln-", meaning: "Wound", type: "root" }, { part: "-us", meaning: "Nom.", type: "suffix" }], usage: { sentence: "Vulnus grave est.", translation: "The wound is serious." }, grammar_tags: ["3rd Declension"] }
    ]
  }
};

const INITIAL_SYSTEM_LESSONS = [
  {
    id: 'l1',
    title: "Salutationes",
    subtitle: "Greetings in the Forum",
    description: "Learn how to greet friends and elders.",
    xp: 50,
    vocab: ['Salve', 'Vale', 'Quid agis?'],
    blocks: [
      {
        type: 'text',
        title: 'The Basics',
        content: 'In Latin, we distinguish between addressing one person ("Salve") and multiple people ("Salvete").'
      },
      {
        type: 'dialogue',
        lines: [
          { speaker: "Marcus", text: "Salve, Iulia!", translation: "Hello, Julia!", side: "left" },
          { speaker: "Iulia", text: "Salve, Marce.", translation: "Hello, Marcus.", side: "right" }
        ]
      },
      {
        type: 'quiz',
        question: "How do you say 'Hello' to a group?",
        options: [{ id: 'a', text: "Salve" }, { id: 'b', text: "Salvete" }, { id: 'c', text: "Vale" }],
        correctId: 'b'
      }
    ]
  }
];

const TYPE_COLORS: any = {
  verb: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' },
  noun: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  adverb: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  phrase: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
  adjective: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' }
};

function Toast({ message, onClose }: any) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900/90 backdrop-blur-sm text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300 border border-white/10">
      <Check size={16} className="text-emerald-400" />
      <span className="text-sm font-medium tracking-wide">{message}</span>
    </div>
  );
}

function Navigation({ activeTab, setActiveTab }: any) {
  const tabs = [
    { id: 'home', icon: Home, label: 'Domus' },
    { id: 'flashcards', icon: Layers, label: 'Chartae' },
    { id: 'profile', icon: User, label: 'Ego' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      {tabs.map((tab) => (
        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center space-y-1 transition-all duration-200 ${activeTab === tab.id ? 'text-indigo-600 scale-105' : 'text-slate-400'}`}>
          <tab.icon size={24} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
          <span className="text-[10px] font-bold tracking-wide uppercase">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

function Header({ title, subtitle, rightAction, onClickTitle }: any) {
  return (
    <div className="px-6 pt-12 pb-6 bg-white sticky top-0 z-40 border-b border-slate-100 flex justify-between items-end">
        <div onClick={onClickTitle} className={onClickTitle ? "cursor-pointer active:opacity-60 transition-opacity" : ""}>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">{title} {onClickTitle && <ChevronDown size={20} className="text-slate-400" />}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1 font-medium">{subtitle}</p>}
        </div>
        {rightAction}
    </div>
  );
}

// --- GAME COMPONENTS ---

function MatchingGame({ deckCards, onGameEnd }: any) {
    const [cards, setCards] = useState<any[]>([]);
    const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
    const [matchedIndices, setMatchedIndices] = useState<number[]>([]);
    const [isChecking, setIsChecking] = useState(false);
    
    // Prepare the cards
    useEffect(() => {
        if (deckCards.length < 3) return; // Need at least 3 pairs

        // Take up to 6 cards to keep grid manageable on mobile
        const gameItems = deckCards.slice(0, 6).flatMap((card: any, index: number) => [
            { id: `term-${index}`, content: card.front, matchId: index, isTerm: true, key: `t-${index}` },
            { id: `def-${index}`, content: card.back, matchId: index, isTerm: false, key: `d-${index}` }
        ]);

        // Fisher-Yates shuffle
        for (let i = gameItems.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [gameItems[i], gameItems[j]] = [gameItems[j], gameItems[i]];
        }

        setCards(gameItems);
        setFlippedIndices([]);
        setMatchedIndices([]);
        setIsChecking(false);
    }, [deckCards]);

    const handleCardClick = (index: number) => {
        if (isChecking || matchedIndices.includes(index) || flippedIndices.includes(index)) return;
        const newFlipped = [...flippedIndices, index];
        setFlippedIndices(newFlipped);

        if (newFlipped.length === 2) {
            setIsChecking(true);
            const [firstIndex, secondIndex] = newFlipped;
            const firstCard = cards[firstIndex];
            const secondCard = cards[secondIndex];

            if (firstCard.matchId === secondCard.matchId) {
                setMatchedIndices([...matchedIndices, firstIndex, secondIndex]);
                setFlippedIndices([]);
                setIsChecking(false);
                if (matchedIndices.length + 2 === cards.length) {
                    onGameEnd(50);
                }
            } else {
                setTimeout(() => {
                    setFlippedIndices([]);
                    setIsChecking(false);
                }, 1000);
            }
        }
    };
    
    if (deckCards.length < 3) {
        return <div className="p-6 text-center text-slate-500"><AlertTriangle size={24} className="mx-auto text-amber-500 mb-2" /><p>Need at least 3 cards in this deck for the Matching Game!</p></div>;
    }

    return (
        <div className="p-6 space-y-4 bg-slate-100 rounded-2xl h-full overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><GanttChart size={24} className="text-indigo-600" /> Matching Game</h3>
            <div className="grid grid-cols-3 gap-3 w-full max-w-sm mx-auto pb-4">
                {cards.map((card, index) => {
                    const isFlippedOrMatched = flippedIndices.includes(index) || matchedIndices.includes(index);
                    const isMatched = matchedIndices.includes(index);
                    return (
                        <div 
                            key={card.key} 
                            onClick={() => handleCardClick(index)}
                            className={`h-24 p-2 rounded-xl text-center flex items-center justify-center transition-all duration-300 transform perspective-1000 cursor-pointer ${isMatched ? 'scale-95 opacity-50 bg-emerald-100' : 'bg-white shadow-md hover:scale-[1.03]'}`}
                            style={{ opacity: isMatched ? 0.4 : 1, transform: isFlippedOrMatched ? 'rotateY(0deg)' : 'rotateY(180deg)' }}
                        >
                            <div className={`absolute inset-0 backface-hidden rounded-xl flex items-center justify-center p-2 text-sm font-bold transition-transform ${isFlippedOrMatched ? 'bg-white text-slate-800' : 'bg-indigo-600 text-white rotate-y-180'}`}>
                                {isFlippedOrMatched ? (
                                    <span className={card.isTerm ? 'font-serif' : 'font-sans text-slate-600 text-xs'}>
                                        {card.content}
                                    </span>
                                ) : (
                                    <span className="text-xl font-black">?</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            {matchedIndices.length === cards.length && cards.length > 0 && (
                <div className="p-4 bg-emerald-50 text-emerald-800 font-bold text-center rounded-xl animate-in zoom-in">
                    VICTORIA! All Matched. +50 XP!
                </div>
            )}
        </div>
    );
}

function VocabJack({ deckCards, onGameEnd }: any) {
    const [playerHand, setPlayerHand] = useState<any[]>([]);
    const [dealerHand, setDealerHand] = useState<any[]>([]);
    const [gameState, setGameState] = useState('start'); 
    const [deck, setDeck] = useState<any[]>([]);
    const [question, setQuestion] = useState<any>(null);

    const createDeck = () => {
        const suits = ['♠', '♥', '♦', '♣'];
        const values = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
        const newDeck: any[] = [];
        suits.forEach(s => values.forEach(v => newDeck.push({ s, v, val: v === 'A' ? 11 : ['J','Q','K'].includes(v) ? 10 : parseInt(v) })));
        return newDeck.sort(() => Math.random() - 0.5);
    };

    const calculateScore = (hand: any[]) => {
        let score = hand.reduce((acc, c) => acc + c.val, 0);
        let aces = hand.filter(c => c.v === 'A').length;
        while (score > 21 && aces > 0) { score -= 10; aces--; }
        return score;
    };

    const startGame = useCallback(() => {
        const d = createDeck();
        setPlayerHand([d.pop(), d.pop()]);
        setDealerHand([d.pop(), d.pop()]);
        setDeck(d);
        setGameState('playing');
    }, []);

    const triggerHit = () => {
        const target = deckCards[Math.floor(Math.random() * deckCards.length)];
        const distractors = deckCards.filter((c: any) => c.id !== target.id).sort(() => 0.5 - Math.random()).slice(0, 2);
        const options = [...distractors, target].sort(() => 0.5 - Math.random());
        
        setQuestion({ 
            target, 
            options: options.map((o: any) => ({id: o.id, text: o.back})), 
            question: `What is the English definition of: ${target.front}?`
        });
        setGameState('question');
    };

    const answerQuestion = (answerId: string) => {
        if (answerId === question.target.id) {
            const newCard = deck.pop();
            const newHand = [...playerHand, newCard];
            setPlayerHand(newHand);
            if (calculateScore(newHand) > 21) setGameState('result'); 
            else setGameState('playing');
        } else {
            alert("Incorrect! Turn passed to dealer.");
            stand();
        }
    };

    const stand = () => {
        let dHand = [...dealerHand];
        let dScore = calculateScore(dHand);
        const dDeck = [...deck];
        while (dScore < 17) {
            dHand.push(dDeck.pop());
            dScore = calculateScore(dHand);
        }
        setDealerHand(dHand);
        setDeck(dDeck);
        setGameState('result');
    };

    const pScore = calculateScore(playerHand);
    const dScore = calculateScore(dealerHand);
    let result = "";
    if (gameState === 'result') {
        if (pScore > 21) result = "Bust! Dealer Wins.";
        else if (dScore > 21) result = "Dealer Busts! You Win!";
        else if (pScore > dScore) result = "You Win!";
        else if (dScore > pScore) result = "Dealer Wins.";
        else result = "Push (Tie).";
    }

    if (deckCards.length < 3) return <div className="p-10 text-center text-slate-400">Need at least 3 cards to play VocabJack.</div>;

    return (
        <div className="p-4 flex flex-col h-full overflow-y-auto">
            {gameState === 'start' && (
                <div className="text-center py-10">
                    <Club size={64} className="mx-auto text-indigo-600 mb-4"/>
                    <h2 className="text-3xl font-bold text-slate-900">VocabJack</h2>
                    <p className="text-slate-500 mb-6">Answer vocab questions to HIT.</p>
                    <button onClick={startGame} className="bg-indigo-600 text-white px-8 py-3 rounded-full font-bold shadow-lg">Deal Cards</button>
                </div>
            )}

            {(gameState === 'playing' || gameState === 'result' || gameState === 'question') && (
                <div className="flex-1 flex flex-col justify-between gap-4">
                   <div className="text-center">
                     <p className="text-xs font-bold text-slate-400 uppercase mb-2">Dealer {gameState === 'result' && `(${dScore})`}</p>
                     <div className="flex justify-center gap-2">
                       {dealerHand.map((c, i) => (
                         <div key={i} className="w-12 h-16 bg-white rounded shadow-md border border-slate-200 flex items-center justify-center text-lg font-bold">
                           {gameState !== 'result' && i === 0 ? '?' : <span className={['♥','♦'].includes(c.s) ? 'text-red-500' : 'text-slate-900'}>{c.v}{c.s}</span>}
                         </div>
                       ))}
                     </div>
                   </div>

                   {gameState === 'result' && (
                     <div className="text-center animate-in zoom-in">
                       <h2 className="text-2xl font-bold text-slate-900 mb-2">{result}</h2>
                       {result.includes("You Win") && <p className="text-emerald-600 font-bold mb-2">+50 XP</p>}
                       <button onClick={() => { if(result.includes("You Win")) onGameEnd(50); startGame(); }} className="bg-indigo-600 text-white px-6 py-2 rounded-full font-bold text-sm">Re-Deal</button>
                     </div>
                   )}

                   {gameState === 'question' && (
                     <div className="bg-white p-4 rounded-2xl shadow-xl border-2 border-indigo-100 mx-4">
                       <p className="text-center font-bold text-slate-800 mb-4">Translate: <span className="text-indigo-600">{question.target.front}</span></p>
                       <div className="grid grid-cols-1 gap-2">
                         {question.options.map((opt: any) => (
                           <button key={opt.id} onClick={() => answerQuestion(opt.id)} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm hover:bg-indigo-50">{opt.text}</button>
                         ))}
                       </div>
                     </div>
                   )}

                   <div className="text-center pb-4">
                     <div className="flex justify-center gap-2 mb-4">
                       {playerHand.map((c, i) => (
                         <div key={i} className="w-12 h-16 bg-white rounded shadow-md border border-slate-200 flex items-center justify-center text-lg font-bold">
                           <span className={['♥','♦'].includes(c.s) ? 'text-red-500' : 'text-slate-900'}>{c.v}{c.s}</span>
                         </div>
                       ))}
                     </div>
                     <p className="text-xs font-bold text-slate-400 uppercase mb-4">You ({pScore})</p>
                     {gameState === 'playing' && (
                       <div className="flex justify-center gap-4">
                         <button onClick={triggerHit} className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold shadow-md active:scale-95">HIT</button>
                         <button onClick={stand} className="bg-rose-500 text-white px-6 py-3 rounded-xl font-bold shadow-md active:scale-95">STAND</button>
                       </div>
                     )}
                   </div>
                </div>
            )}
        </div>
    );
}

// --- FLASHCARD VIEW ---
function FlashcardView({ allDecks, selectedDeckKey, onSelectDeck, onSaveCard, activeDeckOverride }: any) {
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [manageMode, setManageMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [xrayMode, setXrayMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [quickAddData, setQuickAddData] = useState({ front: '', back: '', type: 'noun' });
  const [gameMode, setGameMode] = useState('study'); // 'study', 'match', 'vocabjack'
  
  const currentDeck = activeDeckOverride || allDecks[selectedDeckKey];
  const deckCards = currentDeck?.cards || [];
  const card = deckCards[currentIndex];
  const theme = card ? (TYPE_COLORS[card.type] || TYPE_COLORS.noun) : TYPE_COLORS.noun;

  const handleDeckChange = (key: string) => {
    onSelectDeck(key);
    setIsSelectorOpen(false);
    setCurrentIndex(0);
    setIsFlipped(false);
    setXrayMode(false);
    setManageMode(false);
    setGameMode('study'); // Reset to study mode when changing deck
  };

  const handleGameEnd = (xp: number) => {
      alert(`Game Over! You earned ${xp} XP.`);
      setGameMode('study');
  }

  const filteredCards = deckCards.filter((c: any) => 
    (c.front || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.back || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleQuickAdd = (e: any) => {
    e.preventDefault();
    if(!quickAddData.front || !quickAddData.back) return;
    onSaveCard({
        ...quickAddData,
        deckId: selectedDeckKey,
        ipa: "/.../",
        mastery: 0,
        morphology: [{ part: quickAddData.front, meaning: "Custom", type: "root" }],
        usage: { sentence: "-", translation: "-" },
        grammar_tags: ["Quick Add"]
    });
    setQuickAddData({ front: '', back: '', type: 'noun' });
    setSearchTerm(''); 
    alert("Card Added!");
  };

  if (!card && !manageMode) return <div className="h-full flex flex-col bg-slate-50"><Header title={currentDeck?.title || "Empty Deck"} onClickTitle={() => setIsSelectorOpen(!isSelectorOpen)} rightAction={<button onClick={() => setManageMode(true)} className="p-2 bg-slate-100 rounded-full"><List size={20} className="text-slate-600" /></button>} /><div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400"><Layers size={48} className="mb-4 opacity-20" /><p>This deck is empty.</p><button onClick={() => setManageMode(true)} className="mt-4 text-indigo-600 font-bold text-sm">Add Cards</button></div></div>;

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-slate-50 pb-6 relative overflow-hidden">
      <Header 
        title={currentDeck?.title.split(' ')[1] || "Deck"} 
        subtitle={`${currentIndex + 1} / ${deckCards.length}`} 
        onClickTitle={() => setIsSelectorOpen(!isSelectorOpen)} 
        rightAction={
          <div className="flex items-center gap-2">
             <button onClick={() => setManageMode(!manageMode)} className={`p-2 rounded-full transition-colors ${manageMode ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
               {manageMode ? <X size={20} /> : <List size={20} />}
             </button>
          </div>
        }
      />
      
      {/* DECK SELECTOR */}
      {isSelectorOpen && <div className="absolute top-24 left-6 right-6 z-50 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 animate-in fade-in slide-in-from-top-4">{Object.entries(allDecks).map(([key, deck]: any) => (<button key={key} onClick={() => handleDeckChange(key)} className={`w-full text-left p-3 rounded-xl font-bold text-sm mb-1 ${selectedDeckKey === key ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'}`}>{deck.title} <span className="float-right opacity-50">{deck.cards.length}</span></button>))}</div>}
      {isSelectorOpen && <div className="absolute inset-0 z-40 bg-black/5 backdrop-blur-[1px]" onClick={() => setIsSelectorOpen(false)} />}

      {/* TABS FOR STUDY/GAMES */}
      {!manageMode && (
        <div className="px-6 mt-2 mb-2">
          <div className="flex bg-slate-200 p-1 rounded-xl w-full max-w-sm mx-auto">
             <button onClick={() => setGameMode('study')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${gameMode === 'study' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'}`}>Study</button>
             <button onClick={() => setGameMode('match')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${gameMode === 'match' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'}`}>Match</button>
             <button onClick={() => setGameMode('vocabjack')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${gameMode === 'vocabjack' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'}`}>Jack</button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-y-auto pt-4">
        {manageMode ? (
            <div className="p-6">
                 <h3 className="font-bold text-slate-900 mb-4">Deck Manager</h3>
                 <div className="relative mb-6">
                     <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
                     <input 
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       placeholder={`Search ${deckCards.length} cards...`}
                       className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm"
                     />
                 </div>
                 {/* Quick Add (Only for Custom Deck) */}
                 {selectedDeckKey === 'custom' && (
                   <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm mb-6">
                     <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 flex items-center gap-2"><PlusCircle size={14}/> Quick Add</h4>
                     <div className="flex gap-2 mb-2">
                       <input placeholder="Latin Word" value={quickAddData.front} onChange={(e) => setQuickAddData({...quickAddData, front: e.target.value})} className="flex-1 p-2 bg-slate-50 rounded border border-slate-200 text-sm font-bold" />
                       <select value={quickAddData.type} onChange={(e) => setQuickAddData({...quickAddData, type: e.target.value})} className="p-2 bg-slate-50 rounded border border-slate-200 text-xs">
                         <option value="noun">Noun</option><option value="verb">Verb</option><option value="phrase">Phrase</option>
                       </select>
                     </div>
                     <div className="flex gap-2">
                       <input placeholder="English Meaning" value={quickAddData.back} onChange={(e) => setQuickAddData({...quickAddData, back: e.target.value})} className="flex-1 p-2 bg-slate-50 rounded border border-slate-200 text-sm" />
                       <button onClick={handleQuickAdd} className="bg-indigo-600 text-white p-2 rounded-lg"><Plus size={18}/></button>
                     </div>
                   </div>
                 )}
                 <div className="space-y-2">
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cards in Deck</p>
                   {filteredCards.map((c: any, idx: number) => (
                     <button key={idx} onClick={() => { setCurrentIndex(deckCards.indexOf(c)); setManageMode(false); }} className="w-full bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center hover:border-indigo-300 transition-colors text-left">
                       <div><span className="font-bold text-slate-800">{c.front}</span><span className="text-slate-400 mx-2">•</span><span className="text-sm text-slate-500">{c.back}</span></div>
                       <ArrowRight size={16} className="text-slate-300" />
                     </button>
                   ))}
                   {filteredCards.length === 0 && <p className="text-slate-400 text-sm italic">No cards found.</p>}
                 </div>
            </div>
        ) : (
            <>
            {gameMode === 'match' && <MatchingGame deckCards={deckCards} onGameEnd={handleGameEnd} />}
            {gameMode === 'vocabjack' && <VocabJack deckCards={deckCards} onGameEnd={handleGameEnd} />}
            {gameMode === 'study' && card && (
                  <div className="flex-1 flex flex-col items-center justify-center px-4 py-2 perspective-1000 relative z-0">
                      <div className={`relative w-full h-full max-h-[520px] transition-all duration-500 transform preserve-3d cursor-pointer shadow-2xl rounded-3xl ${isFlipped ? 'rotate-y-180' : ''}`} onClick={() => !xrayMode && setIsFlipped(!isFlipped)}>
                          <div className="absolute inset-0 backface-hidden bg-white rounded-3xl border border-slate-100 overflow-hidden flex flex-col">
                            <div className={`h-2 w-full ${xrayMode ? theme.bg.replace('50', '500') : 'bg-slate-100'} transition-colors duration-500`} />
                            <div className="flex-1 flex flex-col p-6 relative">
                              <div className="flex justify-between items-start mb-8"><span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${theme.bg} ${theme.text} border ${theme.border}`}>{card.type}</span></div>
                              <div className="flex-1 flex flex-col items-center justify-center mt-[-40px]"><h2 className="text-4xl sm:text-5xl font-serif font-bold text-slate-900 text-center mb-4 leading-tight">{card.front}</h2><div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-full border border-slate-100"><button onClick={(e) => { e.stopPropagation(); }} className="p-2 bg-white rounded-full shadow-sm text-indigo-600 hover:scale-110 transition-transform active:scale-90"><Volume2 size={18} /></button><span className="font-mono text-slate-500 text-sm tracking-wide">{card.ipa}</span></div></div>
                              <div className={`absolute inset-x-0 bottom-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 transition-all duration-500 ease-in-out flex flex-col overflow-hidden z-20 ${xrayMode ? 'h-[75%] opacity-100 rounded-t-3xl shadow-[-10px_-10px_30px_rgba(0,0,0,0.05)]' : 'h-0 opacity-0'}`}>
                                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Puzzle size={14} /> Morphologia</h4>
                                    <div className="flex flex-wrap gap-2">{Array.isArray(card.morphology) && card.morphology.map((m: any, i: number) => (<div key={i} className="flex flex-col items-center bg-slate-50 border border-slate-200 rounded-lg p-2 min-w-[60px]"><span className={`font-bold text-lg ${m.type === 'root' ? 'text-indigo-600' : 'text-slate-700'}`}>{m.part}</span><span className="text-slate-400 text-[9px] font-medium uppercase mt-1 text-center max-w-[80px] leading-tight">{m.meaning}</span></div>))}</div>
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><MessageSquare size={14} /> Exemplum</h4>
                                    <div className={`p-4 rounded-xl border ${theme.border} ${theme.bg}`}>
                                      <p className="text-slate-800 font-serif font-medium text-lg mb-1">"{card.usage?.sentence || '...'}"</p>
                                      <p className={`text-sm ${theme.text} opacity-80 italic`}>{card.usage?.translation || '...'}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {!xrayMode && (<div className="mt-auto text-center"><p className="text-xs text-slate-400 font-medium animate-pulse">Tap to flip</p></div>)}
                            </div>
                          </div>
                          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-slate-900 rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 text-white relative overflow-hidden"><div className="relative z-10 flex flex-col items-center"><span className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-6 border-b border-indigo-500/30 pb-2">Translatio</span><h2 className="text-4xl font-bold text-center mb-8 leading-tight">{card.back}</h2></div></div>
                      </div>
                  </div>
            )}
            </>
        )}
      </div>

      {/* NAVIGATOR (Study Mode Only) */}
      {gameMode === 'study' && !manageMode && card && (
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between max-w-sm mx-auto">
            <button onClick={() => { setXrayMode(false); setIsFlipped(false); setTimeout(() => setCurrentIndex((prev) => (prev - 1 + deckCards.length) % deckCards.length), 200); }} className="h-14 w-14 rounded-full bg-white border border-slate-100 shadow-md text-rose-500 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"><X size={28} strokeWidth={2.5} /></button>
            <button onClick={(e) => { e.stopPropagation(); if(isFlipped) setIsFlipped(false); setXrayMode(!xrayMode); }} className={`h-20 w-20 rounded-2xl flex flex-col items-center justify-center shadow-lg transition-all duration-300 border-2 ${xrayMode ? 'bg-indigo-600 border-indigo-600 text-white translate-y-[-8px] shadow-indigo-200' : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200'}`}><Search size={28} strokeWidth={xrayMode ? 3 : 2} className={xrayMode ? 'animate-pulse' : ''} /><span className="text-[10px] font-black tracking-wider mt-1">X-RAY</span></button>
            <button onClick={() => { setXrayMode(false); setIsFlipped(false); setTimeout(() => setCurrentIndex((prev) => (prev + 1) % deckCards.length), 200); }} className="h-14 w-14 rounded-full bg-white border border-slate-100 shadow-md text-emerald-500 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"><Check size={28} strokeWidth={2.5} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- REST OF THE COMPONENTS (CardBuilder, LessonBuilder, etc.) ---

function CardBuilderView({ onSaveCard, onUpdateCard, onDeleteCard, availableDecks, initialDeckId }: any) {
  const [formData, setFormData] = useState({
    front: '', back: '', type: 'noun', ipa: '', sentence: '', sentenceTrans: '', grammarTags: '', deckId: initialDeckId || 'custom'
  });
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [morphology, setMorphology] = useState<any[]>([]);
  const [newMorphPart, setNewMorphPart] = useState({ part: '', meaning: '', type: 'root' });
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (initialDeckId) setFormData(prev => ({...prev, deckId: initialDeckId}));
  }, [initialDeckId]);

  const handleChange = (e: any) => {
    if (e.target.name === 'deckId') {
      if (e.target.value === 'new') {
        setIsCreatingDeck(true);
        setFormData({ ...formData, deckId: 'new' });
      } else {
        setIsCreatingDeck(false);
        setFormData({ ...formData, deckId: e.target.value });
      }
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const addMorphology = () => {
    if (newMorphPart.part && newMorphPart.meaning) {
      setMorphology([...morphology, newMorphPart]);
      setNewMorphPart({ part: '', meaning: '', type: 'root' });
    }
  };

  const removeMorphology = (index: number) => {
    setMorphology(morphology.filter((_, i) => i !== index));
  };

  const handleSelectCard = (card: any) => {
    setEditingId(card.id);
    setFormData({
      front: card.front,
      back: card.back,
      type: card.type || 'noun',
      ipa: card.ipa || '',
      sentence: card.usage?.sentence || '',
      sentenceTrans: card.usage?.translation || '',
      grammarTags: card.grammar_tags?.join(', ') || '',
      deckId: card.deckId || formData.deckId
    });
    setMorphology(card.morphology || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClear = () => {
    setEditingId(null);
    setFormData(prev => ({ ...prev, front: '', back: '', type: 'noun', ipa: '', sentence: '', sentenceTrans: '', grammarTags: '' }));
    setMorphology([]);
  };

  const handleSubmit = (e: any) => { 
    e.preventDefault(); 
    if (!formData.front || !formData.back) return; 
    
    let finalDeckId = formData.deckId;
    let finalDeckTitle = null;

    if (formData.deckId === 'new') {
        if (!newDeckTitle) return alert("Please name your new deck.");
        finalDeckId = `custom_${Date.now()}`;
        finalDeckTitle = newDeckTitle;
    }

    const cardData = { 
      front: formData.front,
      back: formData.back,
      type: formData.type,
      deckId: finalDeckId,
      deckTitle: finalDeckTitle,
      ipa: formData.ipa || "/.../",
      mastery: 0,
      morphology: morphology.length > 0 ? morphology : [{ part: formData.front, meaning: "Root", type: "root" }],
      usage: { sentence: formData.sentence || "-", translation: formData.sentenceTrans || "-" },
      grammar_tags: formData.grammarTags ? formData.grammarTags.split(',').map(t => t.trim()) : ["Custom"]
    };

    if (editingId) {
      onUpdateCard(editingId, cardData);
      setToastMsg("Card Updated Successfully");
    } else {
      onSaveCard(cardData);
      setToastMsg("Card Created Successfully");
    }
    
    handleClear();
    if (isCreatingDeck) {
        setIsCreatingDeck(false);
        setNewDeckTitle('');
        setFormData(prev => ({ ...prev, deckId: finalDeckId })); 
    }
  };

  const validDecks = availableDecks || {};
  const deckOptions = Object.entries(validDecks).map(([key, deck]: any) => ({ id: key, title: deck.title }));
  const currentDeckCards = validDecks[formData.deckId] ? validDecks[formData.deckId].cards || [] : validDecks['custom'] ? validDecks['custom'].cards || [] : [];
  
  useEffect(() => {
    if (editingId && !currentDeckCards.some((c: any) => c.id === editingId)) {
        handleClear();
    }
  }, [currentDeckCards, editingId]);

  return (
    <div className="px-6 mt-4 space-y-6 pb-20 relative">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-4 text-sm text-indigo-800 flex justify-between items-center">
        <div><p className="font-bold flex items-center gap-2"><Layers size={16}/> {editingId ? 'Editing Card' : 'Card Creator'}</p><p className="opacity-80 text-xs mt-1">{editingId ? 'Update details below.' : 'Define deep linguistic data (X-Ray).'}</p></div>
        {editingId && <button onClick={handleClear} className="text-xs font-bold bg-white px-3 py-1 rounded-lg shadow-sm hover:text-indigo-600">Cancel Edit</button>}
      </div>
      <section className="space-y-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Core Data</h3>
        <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400">Target Deck</label>
            <select name="deckId" value={formData.deckId} onChange={handleChange} disabled={!!editingId} className="w-full p-3 rounded-lg border border-slate-200 bg-indigo-50/50 font-bold text-indigo-900 disabled:opacity-50"><option value="custom">✍️ Scriptorium (My Deck)</option>{deckOptions.filter(d => d.id !== 'custom').map(d => (<option key={d.id} value={d.id}>{d.title}</option>))}<option value="new">✨ + Create New Deck</option></select>
            {isCreatingDeck && <input value={newDeckTitle} onChange={(e) => setNewDeckTitle(e.target.value)} placeholder="Enter New Deck Name" className="w-full p-3 rounded-lg border-2 border-indigo-500 bg-white font-bold mt-2 animate-in fade-in slide-in-from-top-2" autoFocus />}
        </div>
        <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><label className="text-xs font-bold text-slate-400">Latin Word</label><input name="front" value={formData.front} onChange={handleChange} className="w-full p-3 rounded-lg border border-slate-200 font-bold" placeholder="e.g. Bellum" /></div><div className="space-y-2"><label className="text-xs font-bold text-slate-400">English</label><input name="back" value={formData.back} onChange={handleChange} className="w-full p-3 rounded-lg border border-slate-200" placeholder="e.g. War" /></div></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><label className="text-xs font-bold text-slate-400">Part of Speech</label><select name="type" value={formData.type} onChange={handleChange} className="w-full p-3 rounded-lg border border-slate-200 bg-white"><option value="noun">Noun</option><option value="verb">Verb</option><option value="adjective">Adjective</option><option value="adverb">Adverb</option><option value="phrase">Phrase</option></select></div>
          <div className="space-y-2"><label className="text-xs font-bold text-slate-400">IPA</label><input name="ipa" value={formData.ipa} onChange={handleChange} className="w-full p-3 rounded-lg border border-slate-200 font-mono text-sm" placeholder="/ˈbel.lum/" /></div>
        </div>
      </section>

      <section className="space-y-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Morphology (X-Ray Data)</h3>
        <div className="flex gap-2 items-end"><div className="flex-1 space-y-1"><label className="text-[10px] font-bold text-slate-400">Part</label><input value={newMorphPart.part} onChange={(e) => setNewMorphPart({...newMorphPart, part: e.target.value})} className="w-full p-2 rounded-lg border border-slate-200 text-sm" placeholder="Bell-" /></div><div className="flex-1 space-y-1"><label className="text-[10px] font-bold text-slate-400">Meaning</label><input value={newMorphPart.meaning} onChange={(e) => setNewMorphPart({...newMorphPart, meaning: e.target.value})} className="w-full p-2 rounded-lg border border-slate-200 text-sm" placeholder="War" /></div><div className="w-24 space-y-1"><label className="text-[10px] font-bold text-slate-400">Type</label><select value={newMorphPart.type} onChange={(e) => setNewMorphPart({...newMorphPart, type: e.target.value})} className="w-full p-2 rounded-lg border border-slate-200 text-sm bg-white"><option value="root">Root</option><option value="prefix">Prefix</option><option value="suffix">Suffix</option></select></div><button type="button" onClick={addMorphology} className="bg-indigo-100 text-indigo-600 p-2 rounded-lg hover:bg-indigo-200"><Plus size={20}/></button></div>
        <div className="flex flex-wrap gap-2 mt-2">{morphology.map((m, i) => (<div key={i} className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full text-sm"><span className="font-bold text-indigo-700">{m.part}</span><span className="text-slate-500 text-xs">({m.meaning})</span><button type="button" onClick={() => removeMorphology(i)} className="text-slate-300 hover:text-rose-500"><X size={14}/></button></div>))}</div>
      </section>

      <section className="space-y-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Context & Grammar</h3>
        <div className="space-y-2"><label className="text-xs font-bold text-slate-400">Example Sentence</label><input name="sentence" value={formData.sentence} onChange={handleChange} className="w-full p-3 rounded-lg border border-slate-200 italic" placeholder="Si vis pacem, para bellum." /></div>
        <div className="space-y-2"><label className="text-xs font-bold text-slate-400">Translation</label><input name="sentenceTrans" value={formData.sentenceTrans} onChange={handleChange} className="w-full p-3 rounded-lg border border-slate-200" placeholder="If you want peace, prepare for war." /></div>
        <div className="space-y-2"><label className="text-xs font-bold text-slate-400">Grammar Tags</label><input name="grammarTags" value={formData.grammarTags} onChange={handleChange} className="w-full p-3 rounded-lg border border-slate-200" placeholder="2nd Declension, Neuter" /></div>
      </section>

      <button onClick={handleSubmit} className={`w-full text-white p-4 rounded-xl font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${editingId ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>{editingId ? <><Save size={20}/> Update Card</> : <><Plus size={20}/> Create Card</>}</button>
      {currentDeckCards && currentDeckCards.length > 0 && (
        <div className="pt-6 border-t border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4">Cards in this Deck ({currentDeckCards.length})</h3>
            <div className="space-y-2">
                {currentDeckCards.map((card: any, idx: number) => (
                    <div key={idx} onClick={() => handleSelectCard(card)} className={`p-3 rounded-xl border flex justify-between items-center cursor-pointer transition-colors ${editingId === card.id ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
                        <div><span className="font-bold text-slate-800">{card.front}</span><span className="text-slate-400 mx-2">•</span><span className="text-sm text-slate-500">{card.back}</span></div>
                        <div className="flex items-center gap-2"><Edit3 size={16} className="text-indigo-400" />{/* @ts-ignore */ !(INITIAL_SYSTEM_DECKS as any)[card.deckId] && (<button onClick={(e) => { e.stopPropagation(); onDeleteCard(card.id); }} className="p-1 text-slate-300 hover:text-rose-500"><Trash2 size={16}/></button>)}</div>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
}

function LessonBuilderView({ data, setData, onSave, availableDecks }: any) {
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const updateBlock = (index: number, field: string, value: any) => { const newBlocks = [...(data.blocks || [])]; newBlocks[index] = { ...newBlocks[index], [field]: value }; setData({ ...data, blocks: newBlocks }); };
  const updateDialogueLine = (blockIndex: number, lineIndex: number, field: string, value: any) => { const newBlocks = [...(data.blocks || [])]; newBlocks[blockIndex].lines[lineIndex][field] = value; setData({ ...data, blocks: newBlocks }); };
  const updateVocabItem = (blockIndex: number, itemIndex: number, field: string, value: any) => { const newBlocks = [...(data.blocks || [])]; newBlocks[blockIndex].items[itemIndex][field] = value; setData({ ...data, blocks: newBlocks }); };
  const addBlock = (type: string) => { const baseBlock = type === 'dialogue' ? { type: 'dialogue', lines: [{ speaker: 'A', text: '', translation: '', side: 'left' }] } : type === 'quiz' ? { type: 'quiz', question: '', options: [{id:'a',text:''},{id:'b',text:''}], correctId: 'a' } : type === 'vocab-list' ? { type: 'vocab-list', items: [{ term: '', definition: '' }] } : type === 'flashcard' ? { type: 'flashcard', front: '', back: '' } : type === 'image' ? { type: 'image', url: '', caption: '' } : type === 'note' ? { type: 'note', title: '', content: '' } : { type: 'text', title: '', content: '' }; setData({ ...data, blocks: [...(data.blocks || []), baseBlock] }); };
  const removeBlock = (index: number) => { const newBlocks = [...(data.blocks || [])].filter((_, i) => i !== index); setData({ ...data, blocks: newBlocks }); };
  const handleSave = () => { if (!data.title) return alert("Title required"); const processedVocab = Array.isArray(data.vocab) ? data.vocab : (typeof data.vocab === 'string' ? data.vocab.split(',').map((s: string) => s.trim()) : []); onSave({ ...data, vocab: processedVocab, xp: 100 }); setToastMsg("Lesson Saved Successfully"); };
  const deckOptions = availableDecks ? Object.entries(availableDecks).map(([key, deck]: any) => ({ id: key, title: deck.title })) : [];

  return (
    <div className="px-6 mt-4 space-y-8 pb-20 relative">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      <section className="space-y-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm"><h3 className="font-bold text-slate-800 flex items-center gap-2"><FileText size={18} className="text-indigo-600"/> Lesson Metadata</h3><input className="w-full p-3 rounded-lg border border-slate-200 font-bold" placeholder="Title" value={data.title} onChange={e => setData({...data, title: e.target.value})} /><textarea className="w-full p-3 rounded-lg border border-slate-200 text-sm" placeholder="Description" value={data.description} onChange={e => setData({...data, description: e.target.value})} /><input className="w-full p-3 rounded-lg border border-slate-200 text-sm" placeholder="Vocab (comma separated)" value={data.vocab} onChange={e => setData({...data, vocab: e.target.value})} />
        <div className="mt-2"><label className="text-xs font-bold text-slate-400 uppercase block mb-1">Linked Flashcard Deck</label><select className="w-full p-3 rounded-lg border border-slate-200 bg-white" value={data.relatedDeckId || ''} onChange={e => setData({...data, relatedDeckId: e.target.value})}><option value="">None (No Deck)</option>{deckOptions.map(d => (<option key={d.id} value={d.id}>{d.title}</option>))}</select></div>
      </section>
      <div className="space-y-4"><div className="flex items-center justify-between px-1"><h3 className="font-bold text-slate-800 flex items-center gap-2"><Layers size={18} className="text-indigo-600"/> Content Blocks</h3><span className="text-xs text-slate-400">{(data.blocks || []).length} Blocks</span></div>
        {(data.blocks || []).map((block: any, idx: number) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group"><div className="absolute right-4 top-4 flex gap-2"><span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-1 rounded">{block.type}</span><button onClick={() => removeBlock(idx)} className="text-slate-300 hover:text-rose-500"><Trash2 size={16}/></button></div>
            {block.type === 'text' && (<div className="space-y-3 mt-4"><input className="w-full p-2 border-b border-slate-100 font-bold text-sm focus:outline-none" placeholder="Section Title" value={block.title} onChange={e => updateBlock(idx, 'title', e.target.value)} /><textarea className="w-full p-2 bg-slate-50 rounded-lg text-sm min-h-[80px]" placeholder="Content..." value={block.content} onChange={e => updateBlock(idx, 'content', e.target.value)} /></div>)}
            {block.type === 'note' && (<div className="space-y-3 mt-4"><div className="flex gap-2"><Info size={18} className="text-amber-500"/><input className="flex-1 p-2 border-b border-slate-100 font-bold text-sm focus:outline-none" placeholder="Note Title (e.g. Grammar Tip)" value={block.title} onChange={e => updateBlock(idx, 'title', e.target.value)} /></div><textarea className="w-full p-2 bg-amber-50 border border-amber-100 rounded-lg text-sm min-h-[80px] text-amber-800" placeholder="Tip content..." value={block.content} onChange={e => updateBlock(idx, 'content', e.target.value)} /></div>)}
            {block.type === 'image' && (<div className="space-y-3 mt-4"><div className="flex gap-2 items-center"><Image size={18} className="text-slate-400"/><input className="flex-1 p-2 border-b border-slate-100 text-sm" placeholder="Image URL (e.g., https://placehold.co/400x200)" value={block.url} onChange={e => updateBlock(idx, 'url', e.target.value)} /></div><input className="w-full p-2 bg-slate-50 rounded-lg text-sm" placeholder="Caption" value={block.caption} onChange={e => updateBlock(idx, 'caption', e.target.value)} /></div>)}
            {block.type === 'vocab-list' && (<div className="space-y-3 mt-6"><p className="text-xs font-bold text-slate-400 uppercase">Vocabulary List</p>{block.items.map((item: any, i: number) => (<div key={i} className="flex gap-2"><input className="flex-1 p-2 bg-slate-50 rounded border border-slate-100 text-sm font-bold" placeholder="Term" value={item.term} onChange={e => updateVocabItem(idx, i, 'term', e.target.value)} /><input className="flex-1 p-2 border-b border-slate-100 text-sm" placeholder="Definition" value={item.definition} onChange={e => updateVocabItem(idx, i, 'definition', e.target.value)} /></div>))}<button onClick={() => { const newItems = [...block.items, { term: '', definition: '' }]; updateBlock(idx, 'items', newItems); }} className="text-xs font-bold text-indigo-600 flex items-center gap-1"><Plus size={14}/> Add Term</button></div>)}
            {block.type === 'flashcard' && (<div className="space-y-3 mt-4"><div className="flex gap-2"><FlipVertical size={18} className="text-indigo-500"/><span className="text-sm font-bold text-slate-700">Embedded Flashcard</span></div><input className="w-full p-2 border rounded text-sm font-bold" placeholder="Front (Latin)" value={block.front} onChange={e => updateBlock(idx, 'front', e.target.value)} /><input className="w-full p-2 border rounded text-sm" placeholder="Back (English)" value={block.back} onChange={e => updateBlock(idx, 'back', e.target.value)} /></div>)}
            {block.type === 'dialogue' && (<div className="space-y-3 mt-6">{block.lines.map((line: any, lIdx: number) => (<div key={lIdx} className="flex gap-2 text-sm"><input className="w-16 p-1 bg-slate-50 rounded border border-slate-100 text-xs font-bold" placeholder="Speaker" value={line.speaker} onChange={e => updateDialogueLine(idx, lIdx, 'speaker', e.target.value)} /><div className="flex-1 space-y-1"><input className="w-full p-1 border-b border-slate-100" placeholder="Latin" value={line.text} onChange={e => updateDialogueLine(idx, lIdx, 'text', e.target.value)} /><input className="w-full p-1 text-xs text-slate-500 italic" placeholder="English" value={line.translation} onChange={e => updateDialogueLine(idx, lIdx, 'translation', e.target.value)} /></div></div>))}<button onClick={() => { const newLines = [...block.lines, { speaker: 'B', text: '', translation: '', side: 'right' }]; updateBlock(idx, 'lines', newLines); }} className="text-xs font-bold text-indigo-600 flex items-center gap-1"><Plus size={14}/> Add Line</button></div>)}
            {block.type === 'quiz' && (<div className="space-y-3 mt-4"><input className="w-full p-2 bg-slate-50 rounded-lg font-bold text-sm" placeholder="Question" value={block.question} onChange={e => updateBlock(idx, 'question', e.target.value)} /><div className="space-y-1"><p className="text-[10px] font-bold text-slate-400 uppercase">Options (ID, Text)</p>{block.options.map((opt: any, oIdx: number) => (<div key={oIdx} className="flex gap-2"><input className="w-8 p-1 bg-slate-50 text-center text-xs" value={opt.id} readOnly /><input className="flex-1 p-1 border-b border-slate-100 text-sm" value={opt.text} onChange={(e) => { const newOpts = [...block.options]; newOpts[oIdx].text = e.target.value; updateBlock(idx, 'options', newOpts); }} /></div>))}</div><div className="flex items-center gap-2 text-sm mt-2"><span className="text-slate-500">Correct ID:</span><input className="w-10 p-1 bg-green-50 border border-green-200 rounded text-center font-bold text-green-700" value={block.correctId} onChange={e => updateBlock(idx, 'correctId', e.target.value)} /></div></div>)}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2"><button onClick={() => addBlock('text')} className="p-3 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-500 hover:bg-slate-50"><AlignLeft size={20}/> <span className="text-[10px] font-bold">Text</span></button><button onClick={() => addBlock('dialogue')} className="p-3 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-500 hover:bg-slate-50"><MessageSquare size={20}/> <span className="text-[10px] font-bold">Dialogue</span></button><button onClick={() => addBlock('quiz')} className="p-3 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-500 hover:bg-slate-50"><HelpCircle size={20}/> <span className="text-[10px] font-bold">Quiz</span></button><button onClick={() => addBlock('vocab-list')} className="p-3 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-500 hover:bg-slate-50"><List size={20}/> <span className="text-[10px] font-bold">Vocab List</span></button><button onClick={() => addBlock('flashcard')} className="p-3 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-500 hover:bg-slate-50"><FlipVertical size={20}/> <span className="text-[10px] font-bold">Flashcard</span></button><button onClick={() => addBlock('image')} className="p-3 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-500 hover:bg-slate-50"><Image size={20}/> <span className="text-[10px] font-bold">Image</span></button></div>
      <div className="pt-4 border-t border-slate-100"><button onClick={handleSave} className="w-full bg-indigo-600 text-white p-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"><Save size={20} /> Save Lesson to Library</button></div>
    </div>
  );
}

// --- INSTRUCTOR COMPONENTS ---
function ClassManagerView({ user, lessons, allDecks }: any) {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [newClassName, setNewClassName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignType, setAssignType] = useState('lesson'); 
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const selectedClass = classes.find(c => c.id === selectedClassId);
  useEffect(() => {
    const q = collection(db, 'artifacts', appId, 'users', user.uid, 'classes');
    const unsubscribe = onSnapshot(q, (snapshot) => setClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))), (error) => console.error("Class snapshot error:", error));
    return () => unsubscribe();
  }, [user]);

  const createClass = async (e: any) => {
    e.preventDefault(); if (!newClassName.trim()) return;
    try { await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'classes'), { name: newClassName, code: Math.random().toString(36).substring(2, 8).toUpperCase(), students: [], studentEmails: [], assignments: [], created: Date.now() }); setNewClassName(''); setToastMsg("Class Created Successfully"); } catch (error) { console.error("Create class failed:", error); alert("Failed to create class."); }
  };
  const handleDeleteClass = async (id: string) => { if (window.confirm("Delete this class?")) { try { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'classes', id)); if (selectedClassId === id) setSelectedClassId(null); } catch (error) { console.error("Delete class failed:", error); alert("Failed to delete class."); } } };
  const handleRenameClass = async (classId: string, currentName: string) => { const newName = prompt("Enter new class name:", currentName); if (newName && newName.trim() !== "" && newName !== currentName) { try { await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'classes', classId), { name: newName.trim() }); setToastMsg("Class renamed successfully"); } catch (error) { console.error("Rename failed", error); alert("Failed to rename class"); } } };
  const addStudent = async (e: any) => { e.preventDefault(); if (!newStudentEmail || !selectedClass) return; const normalizedEmail = newStudentEmail.toLowerCase().trim(); try { await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'classes', selectedClass.id), { students: arrayUnion(normalizedEmail), studentEmails: arrayUnion(normalizedEmail) }); setNewStudentEmail(''); setToastMsg(`Added ${normalizedEmail}`); } catch (error) { console.error("Add student failed:", error); alert("Failed to add student."); } };
  const assignContent = async (item: any, type: string) => { if (!selectedClass) return; try { const assignment = JSON.parse(JSON.stringify({ ...item, id: item.id || `assign_${Date.now()}`, contentType: type })); await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'classes', selectedClass.id), { assignments: arrayUnion(assignment) }); setAssignModalOpen(false); setToastMsg(`Assigned: ${item.title}`); } catch (error) { console.error("Assign failed:", error); alert("Failed to assign."); } };

  if (selectedClass) {
    return (
      <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300 relative">
        {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
        <div className="pb-6 border-b border-slate-100 mb-6">
          <button onClick={() => setSelectedClassId(null)} className="flex items-center text-slate-500 hover:text-indigo-600 mb-2 text-sm font-bold"><ArrowLeft size={16} className="mr-1"/> Back to Classes</button>
          <div className="flex justify-between items-end">
            <div><h1 className="text-2xl font-bold text-slate-900">{selectedClass.name}</h1><p className="text-sm text-slate-500 font-mono bg-slate-100 inline-block px-2 py-0.5 rounded mt-1">Code: {selectedClass.code}</p></div>
            <button onClick={() => setAssignModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm"><Plus size={16}/> Assign Content</button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><BookOpen size={18} className="text-indigo-600"/> Assignments</h3>
              {(!selectedClass.assignments || selectedClass.assignments.length === 0) && <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-sm">No content assigned yet.</div>}
              {selectedClass.assignments?.map((l: any, idx: number) => ( <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center"><div><h4 className="font-bold text-slate-800">{l.title}</h4><span className="text-[10px] text-slate-500 uppercase">{l.contentType || 'Lesson'}</span></div><span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-xs font-bold">Active</span></div> ))}
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><Users size={18} className="text-indigo-600"/> Roster</h3>
              <form onSubmit={addStudent} className="flex gap-2"><input value={newStudentEmail} onChange={e => setNewStudentEmail(e.target.value)} placeholder="Student Email" className="flex-1 p-2 rounded-lg border border-slate-200 text-sm" /><button type="submit" className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-lg"><Plus size={18}/></button></form>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">{(!selectedClass.students || selectedClass.students.length === 0) && <div className="p-4 text-center text-slate-400 text-sm italic">No students joined yet.</div>}{selectedClass.students?.map((s: string, i: number) => (<div key={i} className="p-3 border-b border-slate-50 last:border-0 flex items-center gap-3"><div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs">{s.charAt(0)}</div><span className="text-sm font-medium text-slate-700">{s}</span></div>))}</div>
            </div>
        </div>
        {assignModalOpen && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
              <div className="p-4 border-b border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg">Assign Content</h3>
                      <button onClick={() => setAssignModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
                  </div>
                  <div className="flex bg-slate-100 p-1 rounded-lg">
                      <button onClick={() => setAssignType('lesson')} className={`flex-1 py-1 text-sm font-bold rounded-md transition-all ${assignType === 'lesson' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-600'}`}>Lessons</button>
                      <button onClick={() => setAssignType('deck')} className={`flex-1 py-1 text-sm font-bold rounded-md transition-all ${assignType === 'deck' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-600'}`}>Decks</button>
                  </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {assignType === 'lesson' ? (
                     [...INITIAL_SYSTEM_LESSONS, ...lessons].map(l => (
                         <button key={l.id} onClick={() => assignContent(l, 'lesson')} className="w-full text-left p-3 hover:bg-slate-50 rounded-xl transition-colors border-b border-transparent hover:border-slate-100 group">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-indigo-900 group-hover:text-indigo-600">{l.title}</h4>
                                    <p className="text-xs text-slate-500">{l.subtitle}</p>
                                </div>
                                <PlusCircle size={20} className="text-slate-300 group-hover:text-indigo-500 transition-colors"/>
                            </div>
                         </button> 
                     )) 
                ) : ( 
                    Object.entries(allDecks).map(([key, deck]: any) => ( 
                        <button key={key} onClick={() => assignContent({ ...deck, id: key }, 'deck')} className="w-full text-left p-3 hover:bg-slate-50 rounded-xl transition-colors border-b border-transparent hover:border-slate-100 group">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-indigo-900 group-hover:text-indigo-600">{deck.title}</h4>
                                    <p className="text-xs text-slate-500">{deck.cards?.length || 0} Cards</p>
                                </div>
                                <PlusCircle size={20} className="text-slate-300 group-hover:text-indigo-500 transition-colors"/>
                            </div>
                        </button> 
                    )) 
                )}
                {assignType === 'deck' && Object.keys(allDecks).length === 0 && <div className="p-8 text-center text-slate-400 italic text-sm">No decks available. Create one in the Builder!</div>}
                {assignType === 'lesson' && [...INITIAL_SYSTEM_LESSONS, ...lessons].length === 0 && <div className="p-8 text-center text-slate-400 italic text-sm">No lessons available.</div>}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-slate-800">My Classes</h2><form onSubmit={createClass} className="flex gap-2"><input value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="New Class Name" className="p-2 rounded-lg border border-slate-200 text-sm w-64" /><button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2"><Plus size={16}/> Create</button></form></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{classes.map(cls => (<div key={cls.id} onClick={() => setSelectedClassId(cls.id)} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer relative group"><div className="absolute top-4 right-4 flex gap-2"><button onClick={(e) => {e.stopPropagation(); handleRenameClass(cls.id, cls.name);}} className="text-slate-300 hover:text-indigo-500"><Edit3 size={16}/></button><button onClick={(e) => {e.stopPropagation(); handleDeleteClass(cls.id);}} className="text-slate-300 hover:text-rose-500"><Trash2 size={16}/></button></div><div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4 font-bold text-lg">{cls.name.charAt(0)}</div><h3 className="font-bold text-lg text-slate-900">{cls.name}</h3><p className="text-sm text-slate-500 mb-4">{(cls.students || []).length} Students</p><div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg"><span className="text-xs font-mono font-bold text-slate-600 tracking-wider">{cls.code}</span><button className="text-indigo-600 text-xs font-bold flex items-center gap-1" onClick={(e) => {e.stopPropagation(); navigator.clipboard.writeText(cls.code);}}><Copy size={12}/> Copy</button></div></div>))}</div>
    </div>
  );
}

function InstructorDashboard({ user, userData, allDecks, lessons, onSaveLesson, onSaveCard, onUpdateCard, onDeleteCard, onLogout }: any) {
  const [view, setView] = useState('dashboard');
  const [builderData, setBuilderData] = useState({ title: '', subtitle: '', description: '', vocab: '', blocks: [] });
  const [builderMode, setBuilderMode] = useState('lesson');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [importMode, setImportMode] = useState('lesson');

  const handleBulkImport = async () => {
      try {
          const data = JSON.parse(jsonInput);
          if (!Array.isArray(data)) throw new Error("Input must be an array.");
          const batch = writeBatch(db);
          let count = 0;
          data.forEach((item: any) => {
              const id = item.id || `import_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
              if (item.cards && Array.isArray(item.cards)) {
                  const deckId = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
                  const deckTitle = item.title || "Imported Deck";
                  item.cards.forEach((card: any) => {
                      const cardRef = doc(collection(db, 'artifacts', appId, 'users', user.uid, 'custom_cards'));
                      batch.set(cardRef, { ...card, deckId: deckId, deckTitle: deckTitle, type: card.type || 'noun', mastery: 0, grammar_tags: card.grammar_tags || ["Imported"] });
                      count++;
                  });
              } else if (item.blocks || item.dialogue) {
                  const ref = doc(db, 'artifacts', appId, 'users', user.uid, 'custom_lessons', id);
                  batch.set(ref, { ...item, vocab: Array.isArray(item.vocab) ? item.vocab : [], xp: item.xp || 100 });
                  count++;
              }
          });
          await batch.commit(); alert(`Successfully imported ${count} items.`); setJsonInput('');
      } catch (e: any) { alert("Import Failed: " + e.message); }
  };

  const handleEditLesson = (lesson: any) => { const safeLesson = { ...lesson, vocab: Array.isArray(lesson.vocab) ? lesson.vocab.join(', ') : (lesson.vocab || '') }; setBuilderData(safeLesson); setEditingId(lesson.id); setBuilderMode('lesson'); setView('builder'); };
  const handleSaveWithEdit = (data: any) => { if (editingId) { onSaveLesson({ ...data }, editingId); } else { onSaveLesson(data); } setBuilderData({ title: '', subtitle: '', description: '', vocab: '', blocks: [] }); setEditingId(null); };
  const handleEditDeck = (deckId: string) => { setEditingId(deckId); setBuilderMode('deck'); setView('builder'); };
  const NavItem = ({ id, icon: Icon, label }: any) => ( <button onClick={() => { setView(id); setEditingId(null); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === id ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}><Icon size={20} /><span>{label}</span></button> );
  const previewLesson = { ...builderData, vocab: typeof builderData.vocab === 'string' ? builderData.vocab.split(',').map((s: string) => s.trim()) : (builderData.vocab || []), xp: 100, blocks: builderData.blocks || [] };
  const activeStudents = 24; 
  const recentActivity = [ { text: "Marcus finished 'Salutationes'", time: "2m", color: "bg-emerald-500" }, { text: "Julia joined 'Latin 101'", time: "15m", color: "bg-blue-500" }, { text: "New deck created", time: "1h", color: "bg-amber-500" }, ];
  const quickAction = (label: string, icon: any, action: any) => ( <button onClick={action} className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all gap-2"><div className="p-2 bg-indigo-100 text-indigo-600 rounded-full">{icon}</div><span className="text-xs font-bold text-slate-700">{label}</span></button> );

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col p-6 hidden md:flex">
        <div className="flex items-center gap-3 mb-10 px-2"><div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg"><GraduationCap size={24} /></div><div><h1 className="font-bold text-lg leading-none">LinguistFlow</h1><span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Magister Mode</span></div></div>
        <div className="space-y-2 flex-1"><NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" /><NavItem id="classes" icon={School} label="My Classes" /><NavItem id="library" icon={Library} label="Content Library" /><NavItem id="builder" icon={PlusCircle} label="Content Creator" /></div>
        <div className="pt-6 border-t border-slate-100"><div className="mb-4 px-2"><div className="flex justify-between items-center mb-2"><h4 className="text-xs font-bold text-slate-400 uppercase">AI Import</h4><div className="flex bg-slate-100 rounded p-0.5"><button onClick={() => setImportMode('lesson')} className={`px-2 py-0.5 text-[10px] rounded ${importMode === 'lesson' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}>Lesson</button><button onClick={() => setImportMode('deck')} className={`px-2 py-0.5 text-[10px] rounded ${importMode === 'deck' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}>Deck</button></div></div><textarea value={jsonInput} onChange={e => setJsonInput(e.target.value)} className="w-full p-2 text-xs border rounded bg-slate-50 mb-2 font-mono" placeholder={importMode === 'lesson' ? '[{"title": "...", "blocks": [...]}]' : '[{"title": "My Deck", "cards": [{"front": "...", "back": "..."}]}]'} rows={3}></textarea><button onClick={handleBulkImport
