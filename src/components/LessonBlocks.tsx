// src/components/LessonBlocks.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Zap, HelpCircle, X, Check, Layers, ArrowLeft, ArrowRight, 
    User, Brain, RotateCcw, Puzzle, CheckCircle2,
    Move, RotateCw, Maximize2, Sparkles, Flag, Plus, Trash2, Eye
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
            {context && (<div className="mb-3 flex items-center gap-2 text-indigo-900/70 font-bold text-sm uppercase tracking-wide animate-in fade-in slide-in-from-bottom-2"><Zap size={14} className="text-amber-500 fill-amber-500"/>{String(context)}</div>)}
            <div onClick={handleFlip} className={`relative h-64 w-full rounded-3xl cursor-pointer perspective-1000 group transition-all duration-300 ${status === 'success' ? 'ring-4 ring-emerald-100' : status === 'missed' ? 'ring-4 ring-rose-100' : ''}`}>
                <div className="relative w-full h-full transition-all duration-500 transform-style-3d shadow-xl rounded-3xl" style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                    <div className="absolute inset-0 backface-hidden bg-white rounded-3xl border-2 border-slate-100 flex flex-col items-center justify-center p-8 text-center" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                        <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><HelpCircle size={24}/></div>
                        <h3 className="text-2xl font-black text-slate-800 leading-tight">{String(front || '')}</h3>
                        <p className="absolute bottom-6 text-xs font-bold text-indigo-500 uppercase tracking-widest animate-pulse">Tap to Reveal</p>
                    </div>
                    <div className="absolute inset-0 backface-hidden bg-slate-900 rounded-3xl flex flex-col items-center justify-center p-8 text-center text-white relative overflow-hidden" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                        <div className={`absolute inset-0 opacity-20 transition-colors duration-500 ${status === 'success' ? 'bg-emerald-500' : status === 'missed' ? 'bg-rose-500' : 'bg-indigo-500'}`}></div>
                        <div className="relative z-10 flex flex-col items-center w-full h-full justify-center">
                            <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">Answer</span>
                            <h3 className="text-2xl font-bold mb-6">{String(back || '')}</h3>
                            <div className="w-full grid grid-cols-2 gap-3 mt-4">
                                <button onClick={(e) => handleRating('missed', e)} className={`py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${status === 'missed' ? 'bg-rose-500 text-white shadow-lg scale-105' : 'bg-white/10 text-white/70 hover:bg-rose-500/50'}`}><X size={14}/> I missed it</button>
                                <button onClick={(e) => handleRating('success', e)} className={`py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${status === 'success' ? 'bg-emerald-500 text-white shadow-lg scale-105' : 'bg-white/10 text-white/70 hover:bg-emerald-500/50'}`}><Check size={14}/> I knew it</button>
                            </div>
                        </div>
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
    
    if (!Array.isArray(items) || items.length === 0) return <div className="p-4 bg-slate-50 text-slate-400 text-center rounded-2xl">Deck Empty</div>;
    
    const currentCard = items[index] || items[0];
    const handleSwipe = (dir: number) => { setIsFlipped(false); setTimeout(() => { setIndex((prev) => (prev + dir + items.length) % items.length); }, 200); };
    
    return (
        <div className="my-8 w-[90%] max-w-sm mx-auto relative">
            <div className="flex justify-between items-center mb-4 px-2"><h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2"><Layers size={14}/> {String(title || "Flashcards")}</h4><div className="flex gap-1">{items.map((_:any, i:number) => <div key={i} className={`h-1 w-4 rounded-full transition-colors ${i === index ? 'bg-indigo-500' : 'bg-slate-200'}`} />)}</div></div>
            <div className="group h-64 cursor-pointer relative perspective-1000" onClick={() => setIsFlipped(!isFlipped)}>
                <div className="relative w-full h-full transition-all duration-500 transform-style-3d" style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                    <div className="absolute inset-0 bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center justify-center p-6 text-center backface-hidden" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                        <span className="absolute top-4 left-4 text-[10px] font-bold text-slate-300 uppercase">Term</span>
                        <h3 className="text-2xl font-black text-slate-800">{String(currentCard.term || currentCard.front || '')}</h3>
                        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-slate-300 font-medium uppercase tracking-widest">Tap to Flip</p>
                    </div>
                    <div className="absolute inset-0 bg-slate-900 rounded-2xl shadow-xl flex flex-col items-center justify-center p-6 text-white text-center backface-hidden" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                        <span className="absolute top-4 left-4 text-[10px] font-bold text-slate-500 uppercase">Definition</span>
                        <p className="text-lg font-medium leading-relaxed relative z-10">{String(currentCard.definition || currentCard.back || '')}</p>
                    </div>
                </div>
                <div className="absolute top-2 left-2 w-full h-full bg-slate-100 rounded-2xl -z-10 border border-slate-200 shadow-sm transform rotate-2"></div>
            </div>
            <div className="flex justify-between items-center mt-6 px-4">
                <button onClick={() => handleSwipe(-1)} className="p-3 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 shadow-sm active:scale-95"><ArrowLeft size={20}/></button>
                <div className="text-xs font-bold text-slate-400">{index + 1} / {items.length}</div>
                <button onClick={() => handleSwipe(1)} className="p-3 rounded-full bg-slate-900 text-white shadow-lg hover:bg-indigo-600 active:scale-95"><ArrowRight size={20}/></button>
            </div>
        </div>
    );
};

// 3. SCENARIO BLOCK (Branching)
export const ScenarioBlock = ({ block, onComplete, onStateChange }: any) => {
    const nodes = Array.isArray(block?.nodes) ? block.nodes : [];
    const [currentNodeId, setCurrentNodeId] = useState(nodes[0]?.id);
    const [history, setHistory] = useState<string[]>([]);
    
    useEffect(() => {
        if (onStateChange) onStateChange({ currentNodeId });
    }, [currentNodeId, onStateChange]);

    if (nodes.length === 0) return <div className="p-4 bg-red-50 text-red-500">Error: Invalid Scenario</div>;
    const currentNode = nodes.find((n:any) => String(n.id) === String(currentNodeId));
    if (!currentNode) return <div className="p-4 bg-red-50 text-red-500">Error: Broken Link</div>;

    const isEnd = !Array.isArray(currentNode.options) || currentNode.options.length === 0 || String(currentNode.options[0]?.nextNodeId) === 'end';
    const bgColors: any = { neutral: 'bg-slate-900', success: 'bg-emerald-900', failure: 'bg-rose-900', critical: 'bg-amber-900' };
    const borderColor = currentNode.color === 'success' ? 'border-emerald-500' : currentNode.color === 'failure' ? 'border-rose-500' : 'border-slate-700';

    return (
        <div className={`${bgColors[currentNode.color || 'neutral']} text-white rounded-3xl overflow-hidden shadow-2xl border-4 ${borderColor} my-8 transition-colors duration-500`}>
            {currentNode.imageUrl && (
                <div className="h-48 w-full overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent z-10"/>
                    <img src={String(currentNode.imageUrl)} alt="Scene" className="w-full h-full object-cover"/>
                </div>
            )}
            <div className="p-4 border-b border-white/10 flex justify-between items-center relative z-20">
                <span className="text-xs font-bold uppercase tracking-widest text-white/70 flex items-center gap-2">
                    {currentNode.speaker ? <User size={14}/> : <Brain size={14}/>} {String(currentNode.speaker || 'Scene')}
                </span>
                {history.length > 0 && (
                    <button onClick={() => { setCurrentNodeId(nodes[0].id); setHistory([]); }} className="text-xs text-white/50 hover:text-white flex items-center gap-1">
                        <RotateCcw size={12}/> Restart
                    </button>
                )}
            </div>
            <div className="p-6 relative z-20 min-h-[100px] flex items-center">
                <p className="text-xl font-serif leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-500">"{String(currentNode.text || '')}"</p>
            </div>
            <div className="bg-black/20 p-2 grid gap-2 backdrop-blur-sm">
                {!isEnd ? (Array.isArray(currentNode.options) ? currentNode.options : []).map((opt:any, i:number) => (
                    <button key={i} onClick={() => { setHistory([...history, String(currentNode.text)]); setCurrentNodeId(opt.nextNodeId); }} className="w-full p-4 text-left bg-white/10 hover:bg-white/20 rounded-xl transition-all font-bold text-sm border border-white/5 hover:border-white/30 flex justify-between items-center group">
                        <span>{String(opt.text || '')}</span><ArrowRight size={16} className="opacity-50 group-hover:opacity-100 transition-opacity"/>
                    </button>
                )) : (
                    <button onClick={onComplete} className="w-full p-4 bg-white text-slate-900 hover:bg-emerald-400 rounded-xl font-bold flex items-center justify-center gap-2 animate-pulse shadow-lg">
                        Complete Scenario <Check size={16}/>
                    </button>
                )}
            </div>
        </div>
    );
};

// 4. QUIZ BLOCK
export const QuizBlock = ({ block, onComplete, onStateChange }: any) => {
    const [selected, setSelected] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    
    const question = String(block?.question || "Missing Question");
    const options = Array.isArray(block?.options) ? block.options : [];
    const correctId = String(block?.correctId || "");
    const isCorrect = selected === correctId;

    useEffect(() => {
        if (onStateChange) onStateChange({ selected, submitted, isCorrect });
    }, [selected, submitted, isCorrect, onStateChange]);

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm my-8">
            <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-start gap-2">
                <span className="bg-indigo-100 text-indigo-600 p-1 rounded-lg mt-1 shrink-0"><HelpCircle size={16}/></span>
                {question}
            </h3>
            <div className="space-y-2">
                {options.map((opt:any) => { 
                    const optId = String(opt.id);
                    let style = "border-slate-200 hover:bg-slate-50"; 
                    if (submitted) { 
                        if (optId === correctId) style = "bg-emerald-100 border-emerald-500 text-emerald-800 font-bold"; 
                        else if (optId === selected) style = "bg-rose-100 border-rose-500 text-rose-800 opacity-60"; 
                        else style = "opacity-50 grayscale"; 
                    } else if (selected === optId) { 
                        style = "border-indigo-500 bg-indigo-50 text-indigo-700 font-bold ring-1 ring-indigo-500"; 
                    } 
                    return (
                        <button key={optId} disabled={submitted} onClick={() => setSelected(optId)} className={`w-full p-4 text-left border-2 rounded-xl transition-all ${style}`}>
                            {String(opt.text || '')}
                        </button>
                    ); 
                })}
            </div>
            {!submitted ? (
                <button onClick={() => setSubmitted(true)} disabled={!selected} className="w-full mt-4 py-3 bg-slate-900 text-white rounded-xl font-bold disabled:opacity-50 transition-all">
                    Check Answer
                </button>
            ) : (
                <div className={`mt-4 p-3 rounded-xl flex justify-between items-center animate-in zoom-in ${isCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    <span className="font-bold flex items-center gap-2">
                        {isCorrect ? <><Check size={18}/> Correct!</> : <><X size={18}/> Incorrect</>}
                    </span>
                    {isCorrect ? (
                        <button onClick={onComplete} className="px-3 py-1 bg-white border border-emerald-200 rounded-lg text-xs font-bold shadow-sm">Continue</button>
                    ) : (
                        <button onClick={() => { setSubmitted(false); setSelected(null); }} className="px-3 py-1 bg-white border border-rose-200 rounded-lg text-xs font-bold shadow-sm">Try Again</button>
                    )}
                </div>
            )}
        </div>
    );
};

// 5. FILL-IN-THE-BLANK BLOCK (ARMORED + STICKY WORD BANK)
export const FillBlankBlock = ({ block, onComplete, onStateChange }: any) => {
    const rawText = String(block?.text || "Missing text [here].");
    
    const { textParts, correctAnswers } = useMemo(() => {
        const parts = rawText.split(/\[.*?\]/g);
        const answers: string[] = [];
        const regex = /\[(.*?)\]/g;
        let match;
        while ((match = regex.exec(rawText)) !== null) {
            answers.push(String(match[1]));
        }
        return { textParts: parts, correctAnswers: answers };
    }, [rawText]);

    const distractorsJson = JSON.stringify(block?.distractors || []);
    
    const distractors = useMemo(() => {
        let rawOptions = [];
        try { rawOptions = JSON.parse(distractorsJson); } catch (e) {}
        if (!Array.isArray(rawOptions)) rawOptions = typeof rawOptions === 'string' ? [rawOptions] : [];
        return rawOptions.map((opt: any) => String(opt)).filter(Boolean);
    }, [distractorsJson]);

    const initialWordBank = useMemo(() => {
        return [...correctAnswers, ...distractors]
            .map((w, i) => ({ id: `word_${i}_${w}`, word: w }))
            .sort(() => Math.random() - 0.5);
    }, [correctAnswers, distractors]);

    const [wordBank, setWordBank] = useState<{id: string, word: string}[]>(initialWordBank);
    const [answers, setAnswers] = useState<({id: string, word: string} | null)[]>(Array(correctAnswers.length).fill(null));
    const [submitted, setSubmitted] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);

    useEffect(() => {
        if (onStateChange) onStateChange({ answers, submitted, isCorrect });
    }, [answers, submitted, isCorrect, onStateChange]);

    const handleBankClick = (item: {id: string, word: string}) => {
        if (submitted) return;
        const firstEmptyIdx = answers.indexOf(null); 
        if (firstEmptyIdx !== -1) {
            const newAnswers = [...answers];
            newAnswers[firstEmptyIdx] = item;
            setAnswers(newAnswers);
            setWordBank(wordBank.filter(w => w.id !== item.id));
        }
    };

    const handleBlankClick = (item: {id: string, word: string} | null, idx: number) => {
        if (submitted || !item) return;
        const newAnswers = [...answers];
        newAnswers[idx] = null; 
        setAnswers(newAnswers);
        setWordBank([...wordBank, item]);
    };

    const checkAnswers = () => {
        let allMatch = true;
        for (let i = 0; i < answers.length; i++) {
            if (answers[i]?.word !== correctAnswers[i]) {
                allMatch = false;
                break;
            }
        }
        setIsCorrect(allMatch); 
        setSubmitted(true);
    };

    const reset = () => { 
        setAnswers(Array(correctAnswers.length).fill(null)); 
        setWordBank(initialWordBank); 
        setSubmitted(false); 
        setIsCorrect(false); 
    };

    const isComplete = answers.length > 0 && answers.indexOf(null) === -1;

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm my-8 animate-in zoom-in-95 duration-300">
            <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-start gap-2">
                <span className="bg-indigo-100 text-indigo-600 p-1 rounded-lg mt-1 shrink-0"><Puzzle size={16}/></span>
                {String(block?.question || "Fill in the blanks")}
            </h3>

            {/* STICKY TOP WORD BANK */}
            <div className="sticky top-2 z-30 mb-8 -mx-2 px-2">
                <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 border border-slate-200/50 shadow-md flex flex-wrap gap-2 min-h-[60px] justify-center items-center transition-all duration-300">
                    {wordBank.length === 0 && !submitted ? (
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-emerald-500" /> All words placed
                        </span>
                    ) : (
                        wordBank.map((item) => (
                            <button 
                                key={item.id} onClick={() => handleBankClick(item)} disabled={submitted}
                                className="px-4 py-2.5 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:border-indigo-400 hover:text-indigo-600 transition-all disabled:opacity-50 active:scale-95 text-sm"
                            >
                                {item.word}
                            </button>
                        ))
                    )}
                </div>
            </div>

            <div className="text-xl font-medium leading-loose text-slate-700 mb-10 flex flex-wrap items-center gap-y-3">
                {textParts.map((part: string, idx: number) => {
                    const isLast = idx === textParts.length - 1;
                    const filledItem = answers[idx];
                    
                    let style = "min-w-[80px] h-10 bg-slate-100 border-b-4 border-slate-200 text-slate-400 mx-1 flex items-center justify-center px-4 cursor-pointer transition-all rounded-t-xl"; 
                    if (filledItem && !submitted) style = "min-w-[80px] h-10 bg-indigo-50 border-b-4 border-indigo-400 text-indigo-700 font-bold rounded-xl mx-1 flex items-center justify-center px-4 cursor-pointer shadow-sm active:scale-95 transition-all"; 
                    
                    if (submitted && filledItem) {
                        const isRight = filledItem.word === correctAnswers[idx];
                        style = `min-w-[80px] h-10 font-bold rounded-xl mx-1 flex items-center justify-center px-4 shadow-sm text-white ${isRight ? 'bg-emerald-500 border-emerald-500' : 'bg-rose-500 border-rose-500'}`; 
                    }

                    return (
                        <React.Fragment key={idx}>
                            <span className="mr-1">{String(part)}</span>
                            {!isLast && (
                                <button key={`btn_${idx}`} onClick={() => handleBlankClick(filledItem, idx)} disabled={submitted} className={style}>
                                    {filledItem ? String(filledItem.word) : " "}
                                </button>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
            
            {!submitted ? (
                <button onClick={checkAnswers} disabled={!isComplete} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold disabled:opacity-50 transition-all shadow-lg active:scale-95">
                    Check Answers
                </button>
            ) : (
                <div className={`p-4 rounded-2xl flex justify-between items-center animate-in zoom-in ${isCorrect ? 'bg-emerald-50 border border-emerald-100' : 'bg-rose-50 border border-rose-100'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                            {isCorrect ? <Check size={20} strokeWidth={3}/> : <X size={20} strokeWidth={3}/>}
                        </div>
                        <span className={`font-bold ${isCorrect ? 'text-emerald-800' : 'text-rose-800'}`}>{isCorrect ? "Perfectly placed!" : "Not quite right."}</span>
                    </div>
                    {isCorrect ? (
                        <button onClick={onComplete} className="px-6 py-3 bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-md hover:bg-emerald-600 active:scale-95 transition-all">Continue</button>
                    ) : (
                        <button onClick={reset} className="px-6 py-3 bg-white text-rose-600 border border-rose-200 rounded-xl text-sm font-bold shadow-sm hover:bg-rose-50 active:scale-95 transition-all">Try Again</button>
                    )}
                </div>
            )}
        </div>
    );
};

// 6. CHAT DIALOGUE
export const ChatDialogueBlock = ({ lines }: any) => {
    const safeLines = Array.isArray(lines) ? lines : [];
    
    return (
        <div className="space-y-4 my-8 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
            {safeLines.map((line: any, i: number) => {
                const isA = String(line?.speaker) === 'A' || i % 2 === 0;
                return (
                    <div key={i} className={`flex ${isA ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[85%] p-4 rounded-2xl text-sm relative shadow-sm ${isA ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-none' : 'bg-indigo-600 text-white rounded-tr-none'}`}>
                            <p className="font-medium leading-relaxed text-base">{String(line?.text || '')}</p>
                            {line?.translation && <p className={`text-xs mt-2 pt-2 border-t ${isA ? 'border-slate-100 text-slate-400' : 'border-indigo-500/50 text-indigo-200'}`}>{String(line.translation)}</p>}
                            <span className={`absolute -top-5 text-[10px] font-bold text-slate-400 ${isA ? 'left-0' : 'right-0'}`}>{String(line?.speaker || '?')}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// ============================================================================
//  7. KINETIC CANVAS BLOCK (2D Spatial Physics, Transform & Reaction Engine)
// ============================================================================
export interface KineticEntity {
    id: string;
    label: string;
    sublabel?: string;
    color?: 'indigo' | 'emerald' | 'rose' | 'amber' | 'cyan';
    x: number;
    y: number;
    scale: number;
    rotation: number;
    allowResize?: boolean;
    allowRotate?: boolean;
    targetScale?: number;
    targetRotation?: number;
    variableName?: string;
}

export interface KineticZone {
    id: string;
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface KineticRule {
    id: string;
    entityId: string;
    zoneId: string;
    reaction: 'bounce_glow' | 'chariot_march' | 'lever_tilt' | 'combine_flash';
    message: string;
}

const KINETIC_COLORS: Record<string, string> = {
    indigo: 'bg-indigo-600 text-white border-indigo-400 shadow-indigo-500/30',
    emerald: 'bg-emerald-600 text-white border-emerald-400 shadow-emerald-500/30',
    rose: 'bg-rose-600 text-white border-rose-400 shadow-rose-500/30',
    amber: 'bg-amber-500 text-slate-950 border-amber-300 shadow-amber-500/30',
    cyan: 'bg-cyan-600 text-white border-cyan-400 shadow-cyan-500/30'
};

const KINETIC_BACKGROUNDS: Record<string, string> = {
    grid: 'bg-slate-900 bg-[radial-gradient(#334155_1.5px,transparent_1.5px)] [background-size:24px_24px]',
    roman_road: 'bg-gradient-to-b from-amber-950 via-stone-900 to-slate-950',
    physics_lab: 'bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900',
    parchment: 'bg-gradient-to-br from-amber-50 via-orange-50/80 to-amber-100 text-slate-900'
};

export const KineticCanvasBlock = ({ block, onComplete, onStateChange }: any) => {
    const canvasRef = useRef<HTMLDivElement>(null);

    const initialEntities: KineticEntity[] = useMemo(() => {
        if (Array.isArray(block?.entities) && block.entities.length > 0) {
            return JSON.parse(JSON.stringify(block.entities));
        }
        return [
            { id: 'ent_1', label: 'Marcus', sublabel: 'Nominative (Subj)', color: 'indigo', x: 20, y: 78, scale: 1, rotation: 0, allowResize: false, allowRotate: false, variableName: 'Subject' },
            { id: 'ent_2', label: 'gladium', sublabel: 'Accusative (Obj)', color: 'amber', x: 50, y: 78, scale: 1, rotation: 0, allowResize: true, allowRotate: false, variableName: 'Direct Object' },
            { id: 'ent_3', label: 'portat', sublabel: '3rd Sing. Verb', color: 'emerald', x: 80, y: 78, scale: 1, rotation: 0, allowResize: false, allowRotate: false, variableName: 'Action Verb' }
        ];
    }, [block]);

    const zones: KineticZone[] = useMemo(() => {
        if (Array.isArray(block?.zones) && block.zones.length > 0) return block.zones;
        return [
            { id: 'zone_1', label: '1. Agent (Nominative)', x: 22, y: 32, width: 26, height: 24 },
            { id: 'zone_2', label: '2. Target (Accusative)', x: 50, y: 32, width: 26, height: 24 },
            { id: 'zone_3', label: '3. Action (Verb)', x: 78, y: 32, width: 26, height: 24 }
        ];
    }, [block]);

    const rules: KineticRule[] = useMemo(() => {
        if (Array.isArray(block?.rules) && block.rules.length > 0) return block.rules;
        return [
            { id: 'r1', entityId: 'ent_1', zoneId: 'zone_1', reaction: 'bounce_glow', message: 'Subject locked: Marcus!' },
            { id: 'r2', entityId: 'ent_2', zoneId: 'zone_2', reaction: 'combine_flash', message: 'Accusative Object linked!' },
            { id: 'r3', entityId: 'ent_3', zoneId: 'zone_3', reaction: 'chariot_march', message: 'Syntax Complete! The Legion advances!' }
        ];
    }, [block]);

    const [entities, setEntities] = useState<KineticEntity[]>(initialEntities);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [snappedMap, setSnappedMap] = useState<Record<string, string>>({});
    const [activeReaction, setActiveReaction] = useState<string | null>(null);
    const [reactionBanner, setReactionBanner] = useState<string | null>(null);
    const [isVerified, setIsVerified] = useState(false);

    useEffect(() => {
        if (onStateChange) onStateChange({ entities, snappedMap, isVerified });
    }, [entities, snappedMap, isVerified, onStateChange]);

    const selectedEntity = entities.find(e => e.id === selectedId) || null;
    const bgThemeKey = block?.backgroundTheme || 'grid';
    const isLightTheme = bgThemeKey === 'parchment';

    const triggerCanvasReaction = (reactionType: string, message: string) => {
        setActiveReaction(reactionType);
        setReactionBanner(message);
        setTimeout(() => setActiveReaction(null), 2200);
    };

    const handlePointerDown = (e: React.PointerEvent, entityId: string) => {
        if (isVerified) return;
        e.stopPropagation();
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        setSelectedId(entityId);
        setDraggingId(entityId);
    };

    const handlePointerMove = (e: React.PointerEvent, entityId: string) => {
        if (draggingId !== entityId || !canvasRef.current || isVerified) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const rawX = ((e.clientX - rect.left) / rect.width) * 100;
        const rawY = ((e.clientY - rect.top) / rect.height) * 100;
        const clampedX = Math.max(6, Math.min(94, rawX));
        const clampedY = Math.max(8, Math.min(92, rawY));

        setEntities(prev => prev.map(ent => ent.id === entityId ? { ...ent, x: clampedX, y: clampedY } : ent));
    };

    const handlePointerUp = (e: React.PointerEvent, entityId: string) => {
        if (draggingId !== entityId) return;
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        setDraggingId(null);

        const movedEntity = entities.find(ent => ent.id === entityId);
        if (!movedEntity) return;

        let matchedZone: KineticZone | null = null;
        for (const z of zones) {
            const halfW = z.width / 2;
            const halfH = z.height / 2;
            if (movedEntity.x >= (z.x - halfW) && movedEntity.x <= (z.x + halfW) &&
                movedEntity.y >= (z.y - halfH) && movedEntity.y <= (z.y + halfH)) {
                matchedZone = z;
                break;
            }
        }

        if (matchedZone) {
            setEntities(prev => prev.map(ent => ent.id === entityId ? { ...ent, x: matchedZone!.x, y: matchedZone!.y } : ent));
            const nextSnapped = { ...snappedMap, [entityId]: matchedZone.id };
            setSnappedMap(nextSnapped);

            const matchedRule = rules.find(r => r.entityId === entityId && r.zoneId === matchedZone!.id);
            if (matchedRule) triggerCanvasReaction(matchedRule.reaction, matchedRule.message);
        } else {
            const nextSnapped = { ...snappedMap };
            delete nextSnapped[entityId];
            setSnappedMap(nextSnapped);
        }
    };

    const updateEntityTransform = (id: string, field: 'scale' | 'rotation', value: number) => {
        if (isVerified) return;
        setEntities(prev => prev.map(ent => ent.id === id ? { ...ent, [field]: value } : ent));
    };

    const handleReset = () => {
        setEntities(JSON.parse(JSON.stringify(initialEntities)));
        setSnappedMap({});
        setSelectedId(null);
        setActiveReaction(null);
        setReactionBanner(null);
        setIsVerified(false);
    };

    const ruleStatus = useMemo(() => {
        const results = rules.map(rule => {
            const isZoneMatched = snappedMap[rule.entityId] === rule.zoneId;
            const ent = entities.find(e => e.id === rule.entityId);
            const scaleOk = (ent?.allowResize && ent.targetScale) ? Math.abs(ent.scale - ent.targetScale) <= 0.25 : true;
            const rotateOk = (ent?.allowRotate && ent.targetRotation !== undefined) ? Math.abs(ent.rotation - ent.targetRotation) <= 15 : true;
            return isZoneMatched && scaleOk && rotateOk;
        });
        const completedCount = results.filter(Boolean).length;
        return { completedCount, total: rules.length, allComplete: rules.length > 0 && completedCount === rules.length };
    }, [rules, snappedMap, entities]);

    const handleVerifyAndComplete = () => {
        if (ruleStatus.allComplete) {
            setIsVerified(true);
            triggerCanvasReaction(block?.successAnimation || 'chariot_march', 'All Canvas Objectives Verified!');
            if (onComplete) setTimeout(() => onComplete(), 1200);
        } else {
            setReactionBanner(`Keep going! ${ruleStatus.completedCount} of ${ruleStatus.total} interactions aligned.`);
        }
    };

    return (
        <div className="my-8 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in duration-500">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-50/60 dark:bg-slate-950/50">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                            <Sparkles size={12} /> Kinetic Canvas Lab
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {ruleStatus.completedCount} / {ruleStatus.total} Aligned
                        </span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                        {String(block?.title || 'Interactive Spatial Assembly')}
                    </h3>
                </div>
                <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all active:scale-95"
                >
                    <RotateCcw size={14} /> Reset
                </button>
            </div>

            {/* Live Variable Telemetry */}
            <div className="px-6 py-2.5 bg-slate-100/70 dark:bg-slate-950 border-b border-slate-200/70 dark:border-slate-800 flex items-center gap-2.5 overflow-x-auto custom-scrollbar">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 shrink-0 flex items-center gap-1">
                    <Zap size={12} className="text-amber-500" /> Variables:
                </span>
                {entities.map(ent => {
                    const matchedZone = zones.find(z => z.id === snappedMap[ent.id]);
                    return (
                        <div key={ent.id} className={`px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1.5 shrink-0 border ${matchedZone ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-600'}`}>
                            <span>{ent.variableName || ent.label}:</span>
                            <span className="text-indigo-600">{matchedZone ? matchedZone.label : 'Unplaced'}</span>
                            {ent.allowResize && <span className="opacity-70">({ent.scale.toFixed(1)}x)</span>}
                            {ent.allowRotate && <span className="opacity-70">({ent.rotation}°)</span>}
                        </div>
                    );
                })}
            </div>

            {/* 2D Stage */}
            <div className="p-4 sm:p-6 bg-slate-100 dark:bg-slate-950">
                <div 
                    ref={canvasRef}
                    onPointerDown={() => setSelectedId(null)}
                    className={`relative w-full aspect-[16/10] min-h-[320px] rounded-[2rem] overflow-hidden border-2 border-slate-200 dark:border-slate-800 shadow-inner select-none touch-none ${KINETIC_BACKGROUNDS[bgThemeKey] || KINETIC_BACKGROUNDS.grid}`}
                >
                    {reactionBanner && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-5 py-2 rounded-full bg-slate-900/90 text-white backdrop-blur-md shadow-xl border border-white/20 text-xs font-black flex items-center gap-2 animate-in slide-in-from-top-4">
                            <Sparkles size={14} className="text-amber-400 shrink-0" />
                            <span>{reactionBanner}</span>
                        </div>
                    )}

                    {activeReaction === 'chariot_march' && (
                        <div className="absolute inset-x-0 bottom-5 z-30 pointer-events-none flex items-center justify-center animate-in slide-in-from-left-full duration-700">
                            <div className="px-6 py-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest shadow-2xl flex items-center gap-2 border-2 border-amber-200">
                                <Flag size={16} /> Legion & Chariot Advance Triggered!
                            </div>
                        </div>
                    )}

                    {activeReaction === 'lever_tilt' && (
                        <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
                            <div className="w-56 h-2.5 bg-indigo-400 rounded-full shadow-[0_0_30px_rgba(99,102,241,0.9)] animate-spin" style={{ animationDuration: '1.4s' }} />
                        </div>
                    )}

                    {activeReaction === 'combine_flash' && (
                        <div className="absolute inset-0 z-30 pointer-events-none bg-indigo-500/20 animate-pulse flex items-center justify-center">
                            <div className="w-28 h-28 rounded-full bg-emerald-400/30 blur-2xl animate-ping" />
                        </div>
                    )}

                    {/* Target Snap Zones */}
                    {zones.map((zone) => {
                        const occupiedByEntityId = Object.keys(snappedMap).find(k => snappedMap[k] === zone.id);
                        const isMatchedCorrectly = rules.some(r => r.zoneId === zone.id && r.entityId === occupiedByEntityId);

                        return (
                            <div
                                key={zone.id}
                                style={{ left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.width}%`, height: `${zone.height}%`, transform: 'translate(-50%, -50%)' }}
                                className={`absolute rounded-3xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-2 text-center pointer-events-none ${
                                    isMatchedCorrectly ? 'border-emerald-400 bg-emerald-500/15 scale-105' :
                                    occupiedByEntityId ? 'border-indigo-400 bg-indigo-500/15' :
                                    isLightTheme ? 'border-slate-400/70 bg-white/50 text-slate-600' : 'border-slate-600/80 bg-slate-800/40 text-slate-300'
                                }`}
                            >
                                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-80">{zone.label}</span>
                            </div>
                        );
                    })}

                    {/* Draggable Entities */}
                    {entities.map((ent) => {
                        const isSelected = selectedId === ent.id;
                        const isDragging = draggingId === ent.id;
                        const isSnapped = Boolean(snappedMap[ent.id]);
                        const colorClasses = KINETIC_COLORS[ent.color || 'indigo'] || KINETIC_COLORS.indigo;

                        return (
                            <div
                                key={ent.id}
                                onPointerDown={(e) => handlePointerDown(e, ent.id)}
                                onPointerMove={(e) => handlePointerMove(e, ent.id)}
                                onPointerUp={(e) => handlePointerUp(e, ent.id)}
                                style={{
                                    left: `${ent.x}%`,
                                    top: `${ent.y}%`,
                                    transform: `translate(-50%, -50%) scale(${ent.scale}) rotate(${ent.rotation}deg)`,
                                    touchAction: 'none'
                                }}
                                className={`absolute z-20 px-4 py-3 rounded-2xl border-2 shadow-xl cursor-grab active:cursor-grabbing select-none ${colorClasses} ${
                                    isDragging ? 'z-30 shadow-2xl ring-4 ring-white/40 scale-105' : ''
                                } ${isSelected ? 'ring-4 ring-indigo-300' : ''} ${
                                    activeReaction === 'bounce_glow' && isSnapped ? 'animate-bounce' : ''
                                }`}
                            >
                                <div className="flex items-center gap-2 whitespace-nowrap">
                                    <Move size={14} className="opacity-70 shrink-0" />
                                    <div className="text-left">
                                        <div className="font-black text-xs sm:text-sm leading-tight">{ent.label}</div>
                                        {ent.sublabel && <div className="text-[9px] font-bold uppercase tracking-wider opacity-80">{ent.sublabel}</div>}
                                    </div>
                                    {isSnapped && <CheckCircle2 size={14} className="text-white shrink-0 ml-1" />}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Transform Controls Dock */}
                {selectedEntity && (selectedEntity.allowResize || selectedEntity.allowRotate) && (
                    <div className="mt-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200 shadow-md flex flex-wrap items-center justify-between gap-6">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                            Transform: {selectedEntity.label}
                        </span>
                        <div className="flex flex-wrap items-center gap-6 flex-1 justify-end">
                            {selectedEntity.allowResize && (
                                <div className="flex items-center gap-3 min-w-[170px]">
                                    <Maximize2 size={14} className="text-slate-400" />
                                    <input type="range" min="0.6" max="1.8" step="0.1" value={selectedEntity.scale} onChange={(e) => updateEntityTransform(selectedEntity.id, 'scale', parseFloat(e.target.value))} className="flex-1 accent-indigo-600 cursor-pointer" />
                                    <span className="text-xs font-black text-slate-700 tabular-nums w-9">{selectedEntity.scale.toFixed(1)}x</span>
                                </div>
                            )}
                            {selectedEntity.allowRotate && (
                                <div className="flex items-center gap-3 min-w-[170px]">
                                    <RotateCw size={14} className="text-slate-400" />
                                    <input type="range" min="-90" max="90" step="5" value={selectedEntity.rotation} onChange={(e) => updateEntityTransform(selectedEntity.id, 'rotation', parseInt(e.target.value))} className="flex-1 accent-indigo-600 cursor-pointer" />
                                    <span className="text-xs font-black text-slate-700 tabular-nums w-9">{selectedEntity.rotation}°</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                <span className="text-xs font-bold text-slate-500">
                    {ruleStatus.allComplete ? '✨ All spatial interactions aligned!' : 'Drag objects into the target zones on the canvas.'}
                </span>
                <button
                    type="button"
                    onClick={handleVerifyAndComplete}
                    className={`px-7 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center gap-2 ${
                        isVerified || ruleStatus.allComplete ? 'bg-emerald-500 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                >
                    {isVerified ? <><CheckCircle2 size={16} /> Completed</> : <><Sparkles size={16} /> Verify Canvas</>}
                </button>
            </div>
        </div>
    );
};

// ============================================================================
//  8. KINETIC CANVAS BUILDER (Instructor WYSIWYG Studio for BuilderHub)
// ============================================================================
export const KineticCanvasBuilder = ({ block, onChange }: any) => {
    const [activeTab, setActiveTab] = useState<'canvas' | 'rules' | 'preview'>('canvas');
    const [draggingTarget, setDraggingTarget] = useState<{ type: 'entity' | 'zone', id: string } | null>(null);
    const editorCanvasRef = useRef<HTMLDivElement>(null);

    const entities: KineticEntity[] = Array.isArray(block?.entities) && block.entities.length > 0 ? block.entities : [
        { id: 'ent_1', label: 'Legatus', sublabel: 'Nominative Subject', color: 'indigo', x: 20, y: 80, scale: 1, rotation: 0, allowResize: false, allowRotate: false, variableName: 'Subject' },
        { id: 'ent_2', label: 'epistulam', sublabel: 'Accusative Object', color: 'amber', x: 50, y: 80, scale: 1, rotation: 0, allowResize: false, allowRotate: false, variableName: 'Object' },
        { id: 'ent_3', label: 'mittit', sublabel: 'Transitive Verb', color: 'emerald', x: 80, y: 80, scale: 1, rotation: 0, allowResize: false, allowRotate: false, variableName: 'Verb' }
    ];

    const zones: KineticZone[] = Array.isArray(block?.zones) && block.zones.length > 0 ? block.zones : [
        { id: 'zone_1', label: '1. Nominative (Who?)', x: 22, y: 30, width: 25, height: 24 },
        { id: 'zone_2', label: '2. Accusative (What?)', x: 50, y: 30, width: 25, height: 24 },
        { id: 'zone_3', label: '3. Verb (Action)', x: 78, y: 30, width: 25, height: 24 }
    ];

    const rules: KineticRule[] = Array.isArray(block?.rules) && block.rules.length > 0 ? block.rules : [
        { id: 'r1', entityId: 'ent_1', zoneId: 'zone_1', reaction: 'bounce_glow', message: 'Nominative Subject locked!' },
        { id: 'r2', entityId: 'ent_2', zoneId: 'zone_2', reaction: 'combine_flash', message: 'Direct Object connected!' },
        { id: 'r3', entityId: 'ent_3', zoneId: 'zone_3', reaction: 'chariot_march', message: 'Legatus epistulam mittit! The Chariot Rides!' }
    ];

    const updateBlock = (patch: any) => {
        onChange({ ...block, type: 'kinetic_canvas', entities, zones, rules, ...patch });
    };

    const handleEditorPointerDown = (e: React.PointerEvent, type: 'entity' | 'zone', id: string) => {
        e.stopPropagation();
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        setDraggingTarget({ type, id });
    };

    const handleEditorPointerMove = (e: React.PointerEvent) => {
        if (!draggingTarget || !editorCanvasRef.current) return;
        const rect = editorCanvasRef.current.getBoundingClientRect();
        const x = Math.round(Math.max(8, Math.min(92, ((e.clientX - rect.left) / rect.width) * 100)));
        const y = Math.round(Math.max(10, Math.min(90, ((e.clientY - rect.top) / rect.height) * 100)));

        if (draggingTarget.type === 'entity') {
            updateBlock({ entities: entities.map(ent => ent.id === draggingTarget.id ? { ...ent, x, y } : ent) });
        } else {
            updateBlock({ zones: zones.map(z => z.id === draggingTarget.id ? { ...z, x, y } : z) });
        }
    };

    const handleEditorPointerUp = (e: React.PointerEvent) => {
        if (!draggingTarget) return;
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        setDraggingTarget(null);
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-indigo-100 dark:border-slate-800 p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                        Kinetic Canvas Studio
                    </span>
                    <h4 className="text-lg font-black text-slate-800 dark:text-white mt-1">Interactive 2D Physics & Animation Builder</h4>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button type="button" onClick={() => setActiveTab('canvas')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase ${activeTab === 'canvas' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>1. Layout</button>
                    <button type="button" onClick={() => setActiveTab('rules')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase ${activeTab === 'rules' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>2. Triggers ({rules.length})</button>
                    <button type="button" onClick={() => setActiveTab('preview')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase ${activeTab === 'preview' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>3. Test</button>
                </div>
            </div>

            {activeTab === 'canvas' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500">Drag objects and snap zones on the canvas to position them:</span>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => updateBlock({ zones: [...zones, { id: `zone_${Date.now()}`, label: 'New Zone', x: 50, y: 35, width: 25, height: 24 }] })} className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-[10px] font-black uppercase flex items-center gap-1"><Plus size={12}/> Zone</button>
                            <button type="button" onClick={() => updateBlock({ entities: [...entities, { id: `ent_${Date.now()}`, label: 'New Object', color: 'indigo', x: 50, y: 80, scale: 1, rotation: 0 }] })} className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase flex items-center gap-1"><Plus size={12}/> Object</button>
                        </div>
                    </div>

                    <div ref={editorCanvasRef} onPointerMove={handleEditorPointerMove} onPointerUp={handleEditorPointerUp} className="relative w-full aspect-[16/9] bg-slate-900 rounded-3xl border-2 border-slate-300 overflow-hidden select-none touch-none">
                        {zones.map(z => (
                            <div key={z.id} onPointerDown={(e) => handleEditorPointerDown(e, 'zone', z.id)} style={{ left: `${z.x}%`, top: `${z.y}%`, width: `${z.width}%`, height: `${z.height}%`, transform: 'translate(-50%, -50%)' }} className="absolute rounded-2xl border-2 border-dashed border-emerald-400 bg-emerald-500/10 text-emerald-300 flex flex-col items-center justify-center p-2 cursor-move">
                                <span className="text-[10px] font-black uppercase">{z.label}</span>
                            </div>
                        ))}
                        {entities.map(ent => (
                            <div key={ent.id} onPointerDown={(e) => handleEditorPointerDown(e, 'entity', ent.id)} style={{ left: `${ent.x}%`, top: `${ent.y}%`, transform: 'translate(-50%, -50%)' }} className="absolute z-20 px-4 py-2 rounded-2xl bg-indigo-600 text-white border-2 border-indigo-300 shadow-lg cursor-move flex items-center gap-1.5">
                                <Move size={12} /> <span className="text-xs font-black">{ent.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'rules' && (
                <div className="space-y-3">
                    <button type="button" onClick={() => updateBlock({ rules: [...rules, { id: `r_${Date.now()}`, entityId: entities[0]?.id || '', zoneId: zones[0]?.id || '', reaction: 'bounce_glow', message: 'Matched!' }] })} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase flex items-center gap-1"><Plus size={12}/> Add Trigger Rule</button>
                    {rules.map((r, idx) => (
                        <div key={r.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-black uppercase text-indigo-600">When</span>
                            <select value={r.entityId} onChange={(e) => { const u = [...rules]; u[idx] = { ...r, entityId: e.target.value }; updateBlock({ rules: u }); }} className="px-2.5 py-1.5 rounded-xl bg-white border text-xs font-bold">
                                {entities.map(ent => <option key={ent.id} value={ent.id}>{ent.label}</option>)}
                            </select>
                            <span className="text-[10px] font-black uppercase text-slate-400">➔</span>
                            <select value={r.zoneId} onChange={(e) => { const u = [...rules]; u[idx] = { ...r, zoneId: e.target.value }; updateBlock({ rules: u }); }} className="px-2.5 py-1.5 rounded-xl bg-white border text-xs font-bold">
                                {zones.map(z => <option key={z.id} value={z.id}>{z.label}</option>)}
                            </select>
                            <select value={r.reaction} onChange={(e) => { const u = [...rules]; u[idx] = { ...r, reaction: e.target.value as any }; updateBlock({ rules: u }); }} className="px-2.5 py-1.5 rounded-xl bg-white border text-xs font-bold">
                                <option value="bounce_glow">✨ Bounce & Glow</option>
                                <option value="chariot_march">🏛️ Chariot Advance</option>
                                <option value="lever_tilt">⚖️ Lever Spin</option>
                                <option value="combine_flash">⚡ Combine Flash</option>
                            </select>
                            <input type="text" value={r.message} onChange={(e) => { const u = [...rules]; u[idx] = { ...r, message: e.target.value }; updateBlock({ rules: u }); }} className="flex-1 px-3 py-1.5 rounded-xl bg-white border text-xs font-bold" />
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'preview' && <KineticCanvasBlock block={{ ...block, entities, zones, rules }} />}
        </div>
    );
};
