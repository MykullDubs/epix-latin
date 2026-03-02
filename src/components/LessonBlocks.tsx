// src/components/LessonBlocks.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Zap, HelpCircle, X, Check, Layers, ArrowLeft, ArrowRight, 
    User, Brain, RotateCcw, Puzzle 
} from 'lucide-react';

// ============================================================================
//  DEFINITIVE LESSON ENGINE (Sub-components)
// ============================================================================

// 1. CONCEPT CARD (Single Interactive Card)
export const ConceptCardBlock = ({ front, back, context, onInteraction }: any) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [status, setStatus] = useState<'neutral' | 'success' | 'missed'>('neutral');
    const handleFlip = () => { if (!isFlipped) { setIsFlipped(true); if (onInteraction) onInteraction(); } };
    const handleRating = (rating: 'success' | 'missed', e: any) => { e.stopPropagation(); setStatus(rating); };
    return (
        <div className="my-8 w-full max-w-md mx-auto">
            {context && (<div className="mb-3 flex items-center gap-2 text-indigo-900/70 font-bold text-sm uppercase tracking-wide animate-in fade-in slide-in-from-bottom-2"><Zap size={14} className="text-amber-500 fill-amber-500"/>{context}</div>)}
            <div onClick={handleFlip} className={`relative h-64 w-full rounded-3xl cursor-pointer perspective-1000 group transition-all duration-300 ${status === 'success' ? 'ring-4 ring-emerald-100' : status === 'missed' ? 'ring-4 ring-rose-100' : ''}`}>
                <div className="relative w-full h-full transition-all duration-500 transform-style-3d shadow-xl rounded-3xl" style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                    <div className="absolute inset-0 backface-hidden bg-white rounded-3xl border-2 border-slate-100 flex flex-col items-center justify-center p-8 text-center" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}><div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><HelpCircle size={24}/></div><h3 className="text-2xl font-black text-slate-800 leading-tight">{front}</h3><p className="absolute bottom-6 text-xs font-bold text-indigo-500 uppercase tracking-widest animate-pulse">Tap to Reveal</p></div>
                    <div className="absolute inset-0 backface-hidden bg-slate-900 rounded-3xl flex flex-col items-center justify-center p-8 text-center text-white relative overflow-hidden" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                        <div className={`absolute inset-0 opacity-20 transition-colors duration-500 ${status === 'success' ? 'bg-emerald-500' : status === 'missed' ? 'bg-rose-500' : 'bg-indigo-500'}`}></div>
                        <div className="relative z-10 flex flex-col items-center w-full h-full justify-center"><span className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">Answer</span><h3 className="text-2xl font-bold mb-6">{back}</h3><div className="w-full grid grid-cols-2 gap-3 mt-4"><button onClick={(e) => handleRating('missed', e)} className={`py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${status === 'missed' ? 'bg-rose-500 text-white shadow-lg scale-105' : 'bg-white/10 text-white/70 hover:bg-rose-500/50'}`}><X size={14}/> I missed it</button><button onClick={(e) => handleRating('success', e)} className={`py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${status === 'success' ? 'bg-emerald-500 text-white shadow-lg scale-105' : 'bg-white/10 text-white/70 hover:bg-emerald-500/50'}`}><Check size={14}/> I knew it</button></div></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 2. JUICY DECK (Vocab List / Multiple Cards)
export const JuicyDeckBlock = ({ items, title }: any) => {
    const [index, setIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    // Safety check for empty items to prevent white screen
    if (!items || items.length === 0) return null;
    const currentCard = items[index] || items[0];
    
    const handleSwipe = (dir: number) => { setIsFlipped(false); setTimeout(() => { setIndex((prev) => (prev + dir + items.length) % items.length); }, 200); };
    return (
        <div className="my-8 w-[90%] max-w-sm mx-auto relative">
            <div className="flex justify-between items-center mb-4 px-2"><h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2"><Layers size={14}/> {title || "Flashcards"}</h4><div className="flex gap-1">{items.map((_:any, i:number) => <div key={i} className={`h-1 w-4 rounded-full transition-colors ${i === index ? 'bg-indigo-500' : 'bg-slate-200'}`} />)}</div></div>
            <div className="group h-64 cursor-pointer relative perspective-1000" onClick={() => setIsFlipped(!isFlipped)}><div className="relative w-full h-full transition-all duration-500 transform-style-3d" style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}><div className="absolute inset-0 bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center justify-center p-6 text-center backface-hidden" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}><span className="absolute top-4 left-4 text-[10px] font-bold text-slate-300 uppercase">Term</span><h3 className="text-2xl font-black text-slate-800">{currentCard.term || currentCard.front}</h3><p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-slate-300 font-medium uppercase tracking-widest">Tap to Flip</p></div><div className="absolute inset-0 bg-slate-900 rounded-2xl shadow-xl flex flex-col items-center justify-center p-6 text-white text-center backface-hidden" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}><span className="absolute top-4 left-4 text-[10px] font-bold text-slate-500 uppercase">Definition</span><p className="text-lg font-medium leading-relaxed relative z-10">{currentCard.definition || currentCard.back}</p></div></div><div className="absolute top-2 left-2 w-full h-full bg-slate-100 rounded-2xl -z-10 border border-slate-200 shadow-sm transform rotate-2"></div></div>
            <div className="flex justify-between items-center mt-6 px-4"><button onClick={() => handleSwipe(-1)} className="p-3 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 shadow-sm active:scale-95"><ArrowLeft size={20}/></button><div className="text-xs font-bold text-slate-400">{index + 1} / {items.length}</div><button onClick={() => handleSwipe(1)} className="p-3 rounded-full bg-slate-900 text-white shadow-lg hover:bg-indigo-600 active:scale-95"><ArrowRight size={20}/></button></div>
        </div>
    );
};

// 3. SCENARIO BLOCK (Branching)
export const ScenarioBlock = ({ block, onComplete, onStateChange }: any) => {
    const [currentNodeId, setCurrentNodeId] = useState(block?.nodes?.[0]?.id);
    const [history, setHistory] = useState<string[]>([]);
    
    // Broadcast state to projector
    useEffect(() => {
        if (onStateChange) onStateChange({ currentNodeId });
    }, [currentNodeId, onStateChange]);

    if (!block?.nodes || block.nodes.length === 0) return <div className="p-4 bg-red-50 text-red-500">Error: Invalid Scenario</div>;
    const currentNode = block.nodes.find((n:any) => n.id === currentNodeId);
    if (!currentNode) return <div className="p-4 bg-red-50 text-red-500">Error: Broken Link</div>;

    const isEnd = !currentNode.options || currentNode.options.length === 0 || currentNode.options[0].nextNodeId === 'end';
    const bgColors: any = { neutral: 'bg-slate-900', success: 'bg-emerald-900', failure: 'bg-rose-900', critical: 'bg-amber-900' };
    const borderColor = currentNode.color === 'success' ? 'border-emerald-500' : currentNode.color === 'failure' ? 'border-rose-500' : 'border-slate-700';

    return (
        <div className={`${bgColors[currentNode.color || 'neutral']} text-white rounded-3xl overflow-hidden shadow-2xl border-4 ${borderColor} my-8 transition-colors duration-500`}>
            {currentNode.imageUrl && (<div className="h-48 w-full overflow-hidden relative"><div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent z-10"/><img src={currentNode.imageUrl} alt="Scene" className="w-full h-full object-cover"/></div>)}
            <div className="p-4 border-b border-white/10 flex justify-between items-center relative z-20"><span className="text-xs font-bold uppercase tracking-widest text-white/70 flex items-center gap-2">{currentNode.speaker ? <User size={14}/> : <Brain size={14}/>} {currentNode.speaker || 'Scene'}</span>{history.length > 0 && <button onClick={() => { setCurrentNodeId(block.nodes[0].id); setHistory([]); }} className="text-xs text-white/50 hover:text-white flex items-center gap-1"><RotateCcw size={12}/> Restart</button>}</div>
            <div className="p-6 relative z-20 min-h-[100px] flex items-center"><p className="text-xl font-serif leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-500">"{currentNode.text}"</p></div>
            <div className="bg-black/20 p-2 grid gap-2 backdrop-blur-sm">{!isEnd ? currentNode.options.map((opt:any, i:number) => (<button key={i} onClick={() => { setHistory([...history, currentNode.text]); setCurrentNodeId(opt.nextNodeId); }} className="w-full p-4 text-left bg-white/10 hover:bg-white/20 rounded-xl transition-all font-bold text-sm border border-white/5 hover:border-white/30 flex justify-between items-center group"><span>{opt.text}</span><ArrowRight size={16} className="opacity-50 group-hover:opacity-100 transition-opacity"/></button>)) : (<button onClick={onComplete} className="w-full p-4 bg-white text-slate-900 hover:bg-emerald-400 rounded-xl font-bold flex items-center justify-center gap-2 animate-pulse shadow-lg">Complete Scenario <Check size={16}/></button>)}</div>
        </div>
    );
};

// 4. QUIZ BLOCK
export const QuizBlock = ({ block, onComplete, onStateChange }: any) => {
    const [selected, setSelected] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const isCorrect = selected === block.correctId;

    // Broadcast state to projector
    useEffect(() => {
        if (onStateChange) onStateChange({ selected, submitted, isCorrect });
    }, [selected, submitted, isCorrect, onStateChange]);

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm my-8">
            <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-start gap-2"><span className="bg-indigo-100 text-indigo-600 p-1 rounded-lg mt-1 shrink-0"><HelpCircle size={16}/></span>{block.question}</h3>
            <div className="space-y-2">{block.options.map((opt:any) => { let style = "border-slate-200 hover:bg-slate-50"; if (submitted) { if (opt.id === block.correctId) style = "bg-emerald-100 border-emerald-500 text-emerald-800 font-bold"; else if (opt.id === selected) style = "bg-rose-100 border-rose-500 text-rose-800 opacity-60"; else style = "opacity-50 grayscale"; } else if (selected === opt.id) { style = "border-indigo-500 bg-indigo-50 text-indigo-700 font-bold ring-1 ring-indigo-500"; } return <button key={opt.id} disabled={submitted} onClick={() => setSelected(opt.id)} className={`w-full p-4 text-left border-2 rounded-xl transition-all ${style}`}>{opt.text}</button>; })}</div>
            {!submitted ? (<button onClick={() => setSubmitted(true)} disabled={!selected} className="w-full mt-4 py-3 bg-slate-900 text-white rounded-xl font-bold disabled:opacity-50 transition-all">Check Answer</button>) : (<div className={`mt-4 p-3 rounded-xl flex justify-between items-center animate-in zoom-in ${isCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}><span className="font-bold flex items-center gap-2">{isCorrect ? <><Check size={18}/> Correct!</> : <><X size={18}/> Incorrect</>}</span>{isCorrect ? <button onClick={onComplete} className="px-3 py-1 bg-white border border-emerald-200 rounded-lg text-xs font-bold shadow-sm">Continue</button> : <button onClick={() => { setSubmitted(false); setSelected(null); }} className="px-3 py-1 bg-white border border-rose-200 rounded-lg text-xs font-bold shadow-sm">Try Again</button>}</div>)}
        </div>
    );
};

// 5. FILL-IN-THE-BLANK BLOCK
export const FillBlankBlock = ({ block, onComplete, onStateChange }: any) => {
    const parts = block.text ? block.text.split(/\[(.*?)\]/g) : [];
    const blankCount = Math.floor(parts.length / 2);

    const [answers, setAnswers] = useState<(string | null)[]>(Array(blankCount).fill(null));
    const [selectedWord, setSelectedWord] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);

    // Broadcast state to projector
    useEffect(() => {
        if (onStateChange) onStateChange({ answers, submitted, isCorrect });
    }, [answers, submitted, isCorrect, onStateChange]);

    const wordBank = useMemo(() => {
        const correctWords = parts.filter((_: string, i: number) => i % 2 !== 0);
        const distractors = block.distractors || [];
        return [...correctWords, ...distractors].sort(() => 0.5 - Math.random());
    }, [block.text, block.distractors]);

    const handleBlankClick = (index: number) => {
        if (submitted) return;
        const newAnswers = [...answers];
        if (selectedWord) { newAnswers[index] = selectedWord; setAnswers(newAnswers); setSelectedWord(null); } 
        else if (newAnswers[index]) { newAnswers[index] = null; setAnswers(newAnswers); }
    };

    const checkAnswers = () => {
        const correctWords = parts.filter((_: string, i: number) => i % 2 !== 0);
        const allMatch = answers.every((ans, i) => ans === correctWords[i]);
        setIsCorrect(allMatch); setSubmitted(true);
    };

    const reset = () => { setAnswers(Array(blankCount).fill(null)); setSelectedWord(null); setSubmitted(false); setIsCorrect(false); };
    const availableWords = wordBank.filter((word: string) => { const totalInBank = wordBank.filter((w: string) => w === word).length; const usedInAnswers = answers.filter((a: string | null) => a === word).length; return usedInAnswers < totalInBank; });
    const displayBank = Array.from(new Set(availableWords));

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm my-8 animate-in zoom-in-95 duration-300">
            <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-start gap-2"><span className="bg-indigo-100 text-indigo-600 p-1 rounded-lg mt-1 shrink-0"><Puzzle size={16}/></span>{block.question || "Fill in the blanks"}</h3>
            <div className="text-xl font-medium leading-loose text-slate-700 mb-10 flex flex-wrap items-center gap-y-3">
                {parts.map((part: string, idx: number) => {
                    if (idx % 2 === 0) return <span key={idx} className="mr-1">{part}</span>;
                    const blankIdx = Math.floor(idx / 2); const filledWord = answers[blankIdx]; const isRight = filledWord === part;
                    let style = "bg-slate-100 border-slate-200 text-slate-400 border-dashed"; 
                    if (filledWord && !submitted) style = "bg-indigo-50 border-indigo-300 text-indigo-700 border-solid shadow-sm"; 
                    if (submitted && isRight) style = "bg-emerald-100 border-emerald-500 text-emerald-700 border-solid"; 
                    if (submitted && !isRight) style = "bg-rose-100 border-rose-500 text-rose-700 border-solid"; 
                    return <button key={idx} onClick={() => handleBlankClick(blankIdx)} disabled={submitted} className={`min-w-[80px] h-10 px-4 mx-1 rounded-xl border-2 font-bold text-sm flex items-center justify-center transition-all active:scale-95 ${style} ${selectedWord && !filledWord && !submitted ? 'ring-2 ring-indigo-400 ring-offset-2 animate-pulse' : ''}`}>{filledWord || " "}</button>;
                })}
            </div>
            {!submitted && (<div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Word Bank</span><div className="flex flex-wrap gap-2">{displayBank.map((word, idx) => (<button key={idx} onClick={() => setSelectedWord(word === selectedWord ? null : word as string)} className={`px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95 ${selectedWord === word ? 'bg-indigo-600 text-white shadow-md -translate-y-1' : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-indigo-300'}`}>{word as string}</button>))}{displayBank.length === 0 && <span className="text-slate-400 text-sm italic">All words placed!</span>}</div></div>)}
            {!submitted ? (<button onClick={checkAnswers} disabled={answers.includes(null)} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold disabled:opacity-50 transition-all shadow-lg">Check Answers</button>) : (<div className={`p-4 rounded-2xl flex justify-between items-center animate-in zoom-in ${isCorrect ? 'bg-emerald-50 border border-emerald-100' : 'bg-rose-50 border border-rose-100'}`}><div className="flex items-center gap-3"><div className={`p-2 rounded-full ${isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>{isCorrect ? <Check size={20} strokeWidth={3}/> : <X size={20} strokeWidth={3}/>}</div><span className={`font-bold ${isCorrect ? 'text-emerald-800' : 'text-rose-800'}`}>{isCorrect ? "Perfectly placed!" : "Not quite right."}</span></div>{isCorrect ? <button onClick={onComplete} className="px-6 py-3 bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-md hover:bg-emerald-600 active:scale-95 transition-all">Continue</button> : <button onClick={reset} className="px-6 py-3 bg-white text-rose-600 border border-rose-200 rounded-xl text-sm font-bold shadow-sm hover:bg-rose-50 active:scale-95 transition-all">Try Again</button>}</div>)}
        </div>
    );
};

// 6. CHAT DIALOGUE
export const ChatDialogueBlock = ({ lines }: any) => (
    <div className="space-y-4 my-8 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
        {lines && lines.map((line: any, i: number) => {
            const isA = line.speaker === 'A' || i % 2 === 0;
            return (<div key={i} className={`flex ${isA ? 'justify-start' : 'justify-end'}`}><div className={`max-w-[85%] p-4 rounded-2xl text-sm relative shadow-sm ${isA ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-none' : 'bg-indigo-600 text-white rounded-tr-none'}`}><p className="font-medium leading-relaxed text-base">{line.text}</p>{line.translation && <p className={`text-xs mt-2 pt-2 border-t ${isA ? 'border-slate-100 text-slate-400' : 'border-indigo-500/50 text-indigo-200'}`}>{line.translation}</p>}<span className={`absolute -top-5 text-[10px] font-bold text-slate-400 ${isA ? 'left-0' : 'right-0'}`}>{line.speaker}</span></div></div>);
        })}
    </div>
);
