// src/components/FlashcardView.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, X, Dumbbell, Layers, Play, Zap, HelpCircle, Puzzle } from 'lucide-react';
import { JuicyDeckBlock } from './LessonBlocks'; // Assuming you extracted LessonBlocks earlier!

// ============================================================================
//  4. FLASHCARD VIEW GAMES
// ============================================================================
function MatchingGame({ deckCards, onGameEnd }: any) {
    // Simple Pairs Game Logic
    const [cards, setCards] = useState<any[]>([]);
    const [flipped, setFlipped] = useState<number[]>([]);
    const [solved, setSolved] = useState<number[]>([]);

    useEffect(() => {
        // Create pairs (Front -> Back)
        const gameItems = deckCards.slice(0, 6).flatMap((c: any) => [
            { id: c.id, text: c.front, type: 'front', pairId: c.id },
            { id: c.id + '_back', text: c.back, type: 'back', pairId: c.id }
        ]).sort(() => Math.random() - 0.5);
        setCards(gameItems);
    }, [deckCards]);

    const handleCardClick = (index: number) => {
        if (flipped.length === 2 || flipped.includes(index) || solved.includes(index)) return;
        const newFlipped = [...flipped, index];
        setFlipped(newFlipped);
        
        if (newFlipped.length === 2) {
            const [idx1, idx2] = newFlipped;
            if (cards[idx1].pairId === cards[idx2].pairId) {
                setSolved(prev => [...prev, idx1, idx2]);
                setFlipped([]);
                if (solved.length + 2 === cards.length) setTimeout(() => onGameEnd(100), 500);
            } else {
                setTimeout(() => setFlipped([]), 1000);
            }
        }
    };

    if(cards.length === 0) return <div className="p-8 text-center text-slate-400">Not enough cards for matching.</div>;

    return (
        <div className="p-4 grid grid-cols-3 gap-3 h-full content-start">
            {cards.map((card, i) => (
                <button 
                    key={i} 
                    onClick={() => handleCardClick(i)}
                    className={`aspect-square rounded-xl text-xs font-bold flex items-center justify-center p-2 text-center transition-all duration-300 ${solved.includes(i) ? 'opacity-0' : flipped.includes(i) ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-indigo-300'}`}
                >
                    {card.text}
                </button>
            ))}
        </div>
    );
}

// ============================================================================
//  QUIZ SESSION (Fixed Auto-Advance)
// ============================================================================
function QuizSessionView({ deckCards, onGameEnd }: any) {
    const [index, setIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false); // Prevents double clicking

    // 1. Get Current Card
    const currentCard = deckCards[index];

    // 2. Generate Options (Correct Answer + 3 Random Distractors)
    const options = useMemo(() => {
        if (!currentCard) return [];
        const distractors = deckCards
            .filter((c: any) => c.id !== currentCard.id)
            .sort(() => 0.5 - Math.random())
            .slice(0, 3)
            .map((c: any) => c.back);
        
        return [...distractors, currentCard.back].sort(() => 0.5 - Math.random());
    }, [currentCard, deckCards]);

    // 3. Handle Click
    const handleOptionClick = (option: string) => {
        if (isProcessing) return; // Stop user from clicking multiple times
        setIsProcessing(true);
        setSelectedOption(option);

        const isCorrect = option === currentCard.back;
        const newScore = isCorrect ? score + 1 : score;
        if (isCorrect) setScore(newScore);

        // 4. WAIT & ADVANCE
        setTimeout(() => {
            if (index < deckCards.length - 1) {
                setIndex(prev => prev + 1);
                setSelectedOption(null);
                setIsProcessing(false);
            } else {
                // Game Over
                onGameEnd({ score: newScore, total: deckCards.length });
            }
        }, 1200); // 1.2 second delay to see the result
    };

    if (!currentCard) return <div className="p-10 text-center">Loading...</div>;

    const progress = ((index) / deckCards.length) * 100;

    return (
        <div className="flex flex-col h-full max-w-md mx-auto p-6">
            
            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    <span>Question {index + 1} / {deckCards.length}</span>
                    <span>Score: {score}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            {/* The Question (Front of Card) */}
            <div className="bg-white rounded-3xl shadow-lg border-b-4 border-slate-100 p-10 flex flex-col items-center justify-center text-center min-h-[200px] mb-6 animate-in zoom-in-95 duration-300 key={index}">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Translate this</span>
                <h2 className="text-3xl font-black text-slate-800">{currentCard.front}</h2>
                {currentCard.ipa && <p className="text-sm font-mono text-slate-400 mt-2">{currentCard.ipa}</p>}
            </div>

            {/* The Options */}
            <div className="space-y-3">
                {options.map((opt, idx) => {
                    let stateStyles = "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:shadow-md"; // Default
                    
                    if (selectedOption) {
                        if (opt === currentCard.back) {
                            stateStyles = "bg-emerald-500 border-emerald-600 text-white shadow-emerald-200"; // Correct (Always highlight correct answer)
                        } else if (opt === selectedOption) {
                            stateStyles = "bg-rose-500 border-rose-600 text-white shadow-rose-200"; // Wrong (Highlight if user picked it)
                        } else {
                            stateStyles = "bg-slate-50 border-slate-100 text-slate-300 opacity-50"; // Others fade out
                        }
                    }

                    return (
                        <button
                            key={idx}
                            onClick={() => handleOptionClick(opt)}
                            disabled={isProcessing}
                            className={`w-full p-4 rounded-xl border-2 font-bold text-lg transition-all duration-200 active:scale-95 ${stateStyles} shadow-sm`}
                        >
                            {opt}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// Optional TowerMode placeholder
function TowerMode({ allDecks, user, onExit, onXPUpdate }: any) { 
    return (
        <div className="fixed inset-0 bg-slate-900 z-[60] flex items-center justify-center text-white">
            <div className="text-center">
                <h1>The Tower</h1>
                <p>Climb to the top!</p>
                <button onClick={onExit} className="mt-4 bg-white text-black px-4 py-2 rounded">Exit</button>
            </div>
        </div>
    ); 
}

// ============================================================================
//  VOCAB GYM (Fixed Data & Branding)
// ============================================================================
export default function FlashcardView({ allDecks, selectedDeckKey, onSelectDeck, onSaveCard, activeDeckOverride, onComplete, onLogActivity, userData, user, onDeleteDeck }: any) {
  // Navigation State
  const [internalMode, setInternalMode] = useState<'library' | 'menu' | 'playing'>('library');
  const [activeGame, setActiveGame] = useState<'standard' | 'quiz' | 'match' | 'tower'>('standard');
  
  // LOGIC FIX: Robustly determine the current deck
  // 1. Use the override (from Home/Dashboard) if present.
  // 2. Use the selected key from the library.
  // 3. Fallback to the first deck in the list to prevent crashes.
  const resolvedDeck = activeDeckOverride || allDecks[selectedDeckKey] || Object.values(allDecks)[0];
  
  // Safety check for cards
  const cards = resolvedDeck?.cards || [];
  
  // BRANDING FIX: Rename "Scriptorium" if it appears
  const deckTitle = resolvedDeck?.title === "✍️ Scriptorium" ? "My Collection" : resolvedDeck?.title;

  // Sync state when entering from outside
  useEffect(() => {
      if (activeDeckOverride) {
          setInternalMode('menu');
      }
  }, [activeDeckOverride]);

  // --- Handlers ---
  const launchGame = (mode: 'standard' | 'quiz' | 'match' | 'tower') => {
      setActiveGame(mode);
      setInternalMode('playing');
  };

  const handleBack = () => {
      if (internalMode === 'playing') setInternalMode('menu');
      else if (internalMode === 'menu') {
          setInternalMode('library');
          onSelectDeck(null); 
      }
  };

  const handleGameFinish = (score: number) => {
      const baseXP = activeGame === 'quiz' ? 50 : activeGame === 'match' ? 30 : 10;
      const earnedXP = Math.round(baseXP * (score / 100)); 
      
      // Log analytics
      onLogActivity(resolvedDeck.id || 'custom', earnedXP, `${deckTitle} (${activeGame})`, { score, mode: activeGame });
      
      setInternalMode('menu');
      alert(`Workout Complete! +${earnedXP} XP`);
  };

  // --- 1. LIBRARY VIEW ---
  if (internalMode === 'library') {
      return (
          <div className="h-full flex flex-col bg-slate-50">
              {/* Sticky Gym Header */}
              <div className="bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
                  <div className="flex items-center gap-2">
                      <div className="bg-orange-500 text-white p-1.5 rounded-lg shadow-sm">
                          <Dumbbell size={18} strokeWidth={3}/>
                      </div>
                      <span className="font-black text-slate-800 tracking-tight text-lg">Vocab Gym</span>
                  </div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{Object.keys(allDecks).length} Decks</div>
              </div>

              {/* Deck Grid */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar pb-32">
                  <div className="grid grid-cols-1 gap-4">
                      {Object.entries(allDecks).map(([key, deck]: any) => {
                          const dTitle = deck.title === "✍️ Scriptorium" ? "My Collection" : deck.title;
                          const cardCount = deck.cards?.length || 0;
                          const mastery = Math.floor(Math.random() * 100); // Visual juice placeholder
                          
                          return (
                              <button 
                                  key={key} 
                                  onClick={() => { onSelectDeck(key); setInternalMode('menu'); }}
                                  className="group relative bg-white rounded-3xl p-5 shadow-sm border border-slate-100 hover:border-orange-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden w-full"
                              >
                                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/0 to-orange-500/0 group-hover:from-orange-50 group-hover:to-amber-50 transition-all duration-500"></div>
                                  
                                  <div className="relative z-10 flex justify-between items-start">
                                      <div className="flex items-center gap-4">
                                          <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                                              {deck.icon || <Layers size={24}/>}
                                          </div>
                                          <div>
                                              <h3 className="font-black text-slate-800 text-lg leading-tight group-hover:text-orange-600 transition-colors">{dTitle}</h3>
                                              <p className="text-xs text-slate-400 font-bold mt-1">{cardCount} Cards</p>
                                          </div>
                                      </div>
                                      <div className="bg-slate-50 p-2 rounded-full text-slate-300 group-hover:bg-white group-hover:text-orange-500 shadow-sm transition-colors">
                                          <Play size={16} fill="currentColor"/>
                                      </div>
                                  </div>

                                  {/* Mastery Bar */}
                                  <div className="relative z-10 mt-6">
                                      <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-1">
                                          <span>Mastery</span>
                                          <span>{mastery}%</span>
                                      </div>
                                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                          <div className="h-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-1000" style={{ width: `${mastery}%` }}></div>
                                      </div>
                                  </div>
                              </button>
                          );
                      })}
                  </div>
              </div>
          </div>
      );
  }

  // --- 2. THE MENU VIEW ---
  if (internalMode === 'menu') {
      if (!resolvedDeck) return <div className="p-8 text-center">Loading Deck...</div>;

      return (
          <div className="h-full flex flex-col bg-slate-50">
              <div className="px-6 py-6 pb-0">
                  <button onClick={handleBack} className="flex items-center text-slate-400 hover:text-orange-600 mb-4 text-sm font-bold transition-colors">
                      <ArrowLeft size={16} className="mr-1"/> Back to Library
                  </button>
                  <h1 className="text-3xl font-black text-slate-900 mb-2">{deckTitle}</h1>
                  <p className="text-slate-500 text-sm font-medium">{cards.length} cards available.</p>
              </div>

              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-32">
                  {cards.length < 4 ? (
                      <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                          <Layers size={48} className="text-slate-300 mx-auto mb-4"/>
                          <h3 className="font-bold text-slate-600">Not enough cards</h3>
                          <p className="text-xs text-slate-400 mt-2 mb-6">You need at least 4 cards to unlock games.</p>
                          {/* Only show Add button if it's the custom deck */}
                          {(!resolvedDeck.id || resolvedDeck.id === 'custom') && (
                              <button onClick={() => alert("Go to Studio tab to add cards!")} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-transform">
                                  Add Cards in Studio
                              </button>
                          )}
                      </div>
                  ) : (
                      <>
                          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Choose Workout</h3>
                          <div className="grid grid-cols-2 gap-4">
                              <button onClick={() => launchGame('standard')} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg hover:border-orange-200 hover:-translate-y-1 transition-all group text-left">
                                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Layers size={24}/></div>
                                  <h4 className="font-bold text-slate-800">Flashcards</h4>
                                  <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase">Standard Mode</p>
                              </button>
                              <button onClick={() => launchGame('quiz')} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg hover:border-orange-200 hover:-translate-y-1 transition-all group text-left">
                                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><HelpCircle size={24}/></div>
                                  <h4 className="font-bold text-slate-800">Quiz Mode</h4>
                                  <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase">Multiple Choice</p>
                              </button>
                              <button onClick={() => launchGame('match')} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg hover:border-orange-200 hover:-translate-y-1 transition-all group text-left">
                                  <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Puzzle size={24}/></div>
                                  <h4 className="font-bold text-slate-800">Match 'Em</h4>
                                  <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase">Speed Pairs</p>
                              </button>
                              <button onClick={() => launchGame('tower')} className="bg-slate-900 p-5 rounded-[2rem] shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all group text-left relative overflow-hidden">
                                  <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-black opacity-50"></div>
                                  <div className="relative z-10">
                                      <div className="w-12 h-12 bg-white/10 text-orange-400 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform backdrop-blur-md"><Zap size={24} fill="currentColor"/></div>
                                      <h4 className="font-bold text-white">The Tower</h4>
                                      <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase">Survival Mode</p>
                                  </div>
                              </button>
                          </div>
                      </>
                  )}
              </div>
          </div>
      );
  }

  // --- 3. THE PLAYING VIEW ---
  return (
      <div className="h-full flex flex-col bg-slate-50 animate-in slide-in-from-bottom-4 duration-300">
          <div className="px-6 py-4 bg-white border-b border-slate-100 flex justify-between items-center shadow-sm z-20">
              <button onClick={handleBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-rose-500 transition-colors"><X size={24}/></button>
              <div className="flex flex-col items-center">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{activeGame === 'tower' ? 'Survival' : activeGame}</span>
                  <span className="text-sm font-black text-slate-800">{deckTitle}</span>
              </div>
              <div className="w-8"></div>
          </div>

          <div className="flex-1 overflow-hidden relative">
              {activeGame === 'standard' && <div className="h-full flex flex-col justify-center pb-20"><JuicyDeckBlock items={cards} title="Study Mode" /></div>}
              {activeGame === 'quiz' && <div className="h-full overflow-y-auto"><QuizSessionView deckCards={cards} onGameEnd={(res: any) => handleGameFinish(res.score ? (res.score/res.total)*100 : 0)} /></div>}
              {activeGame === 'match' && <MatchingGame deckCards={cards} onGameEnd={(score: number) => handleGameFinish(score)} />}
              {activeGame === 'tower' && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                      <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-6 animate-bounce"><Zap size={40} className="text-orange-400 fill-orange-400"/></div>
                      <h2 className="text-2xl font-black text-slate-900">The Tower</h2>
                      <p className="text-slate-500 mt-2 mb-8">This mode is under construction by the architects.</p>
                      <button onClick={handleBack} className="px-6 py-3 bg-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-300">Retreat</button>
                  </div>
              )}
          </div>
      </div>
  );
}
