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
//  7. KINETIC CANVAS BLOCK (Multi-Modal Storyline 360 Engine + Cascading Motion)
// ============================================================================
export type KineticObjectState = 'normal' | 'selected' | 'drop_correct' | 'drop_incorrect' | 'hidden' | 'disabled';
export type KineticEntityType = 'draggable' | 'hotspot_label' | 'connector_node' | 'slider' | 'text_input' | 'multi_select';

export interface KineticEntity {
    id: string;
    entityType?: KineticEntityType;
    label: string;
    sublabel?: string;
    imageUrl?: string;
    shape?: 'pill' | 'card' | 'image' | 'circle';
    color?: 'indigo' | 'emerald' | 'rose' | 'amber' | 'cyan' | 'slate';
    x: number;
    y: number;
    width?: number;
    scale: number;
    rotation: number;
    draggable?: boolean;
    initialState?: KineticObjectState;
    allowResize?: boolean;
    allowRotate?: boolean;
    targetScale?: number;
    targetRotation?: number;
    variableName?: string;

    // 1. Sorting & Categorizing
    category?: string;
    // 2. Sequencing & Ordering
    sequenceIndex?: number;
    // 4. Matching with Connector Lines
    connectTargetId?: string;
    // 5. Slider / Number-Line
    sliderMin?: number;
    sliderMax?: number;
    sliderStep?: number;
    sliderTarget?: number;
    sliderTolerance?: number;
    sliderUnit?: string;
    // 6. Text-Entry & Multi-Select
    expectedText?: string;
    placeholder?: string;
    isCorrectSelect?: boolean;
}

export interface KineticZone {
    id: string;
    label: string;
    sublabel?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    invisible?: boolean;
    capacity?: number;
    acceptedCategory?: string;
    sequenceOrder?: number;
    isHotspotPin?: boolean;
}

export interface KineticTimelineKeyframe {
    id: string;
    progress: number;
    title: string;
    description: string;
    entityOverrides?: Array<{
        entityId: string;
        x?: number;
        y?: number;
        scale?: number;
        rotation?: number;
        state?: KineticObjectState;
        labelOverride?: string;
    }>;
}

export interface KineticSlideLayerOption {
    id: string;
    text: string;
}

export interface KineticSlideLayer {
    id: string;
    name: string;
    theme?: 'info' | 'success' | 'warning' | 'error' | 'quiz';
    title: string;
    body: string;
    imageUrl?: string;
    audioUrl?: string;
    buttonLabel?: string;
    hasQuiz?: boolean;
    quizQuestion?: string;
    quizOptions?: KineticSlideLayerOption[];
    correctOptionId?: string;
    gateUntilCorrect?: boolean;
    onCloseAction?: 'hide_layer' | 'change_state' | 'complete_block';
    onCloseTargetEntityId?: string;
    onCloseTargetState?: KineticObjectState;
}

export interface KineticRule {
    id: string;
    event?: 'on_drop' | 'on_click' | 'on_connect' | 'on_slider_match' | 'on_text_match';
    entityId: string;           // Source object that triggers the event
    zoneId: string;             // Source zone where entityId is dropped (for 'on_drop')
    destinationZoneId?: string; // 🔥 Target zone where targetEntityId glides to (for 'move_to_zone')
    action?: 'reaction' | 'change_state' | 'show_layer' | 'hide_layer' | 'move_to_zone' | 'animate_motion' | 'complete_block';
    targetEntityId?: string;    // Object to move or change state
    targetState?: KineticObjectState;
    targetLayerId?: string;
    // Storyline 360 Motion Path Animation Parameters
    motionX?: number;
    motionY?: number;
    motionScale?: number;
    motionRotation?: number;
    motionDuration?: number;
    motionCurve?: 'ease_in_out' | 'spring_bounce' | 'linear';
    reaction: 'bounce_glow' | 'chariot_march' | 'lever_tilt' | 'combine_flash' | 'shake_error';
    message: string;
    isRequired?: boolean;
}

const KINETIC_COLORS: Record<string, string> = {
    indigo: 'bg-indigo-600 text-white border-indigo-400 shadow-indigo-500/30',
    emerald: 'bg-emerald-600 text-white border-emerald-400 shadow-emerald-500/30',
    rose: 'bg-rose-600 text-white border-rose-400 shadow-rose-500/30',
    amber: 'bg-amber-500 text-slate-950 border-amber-300 shadow-amber-500/30',
    cyan: 'bg-cyan-600 text-white border-cyan-400 shadow-cyan-500/30',
    slate: 'bg-slate-800 text-white border-slate-600 shadow-slate-900/30'
};

const KINETIC_BACKGROUNDS: Record<string, string> = {
    blank: 'bg-white dark:bg-slate-900',
    grid: 'bg-slate-900 bg-[radial-gradient(#334155_1.5px,transparent_1.5px)] [background-size:24px_24px]',
    light_grid: 'bg-slate-50 bg-[radial-gradient(#cbd5e1_1.5px,transparent_1.5px)] [background-size:24px_24px] text-slate-900',
    roman_road: 'bg-gradient-to-b from-amber-950 via-stone-900 to-slate-950',
    physics_lab: 'bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900',
    parchment: 'bg-gradient-to-br from-amber-50 via-orange-50/80 to-amber-100 text-slate-900'
};

const MOTION_CURVES: Record<string, string> = {
    ease_in_out: 'cubic-bezier(0.22, 1, 0.36, 1)',
    spring_bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    linear: 'linear'
};

const LAYER_THEME_STYLES: Record<string, { border: string; badge: string; headerBg: string; btn: string }> = {
    info: {
        border: 'border-indigo-400/50 dark:border-indigo-500/40',
        badge: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30',
        headerBg: 'from-indigo-600 to-cyan-500',
        btn: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25'
    },
    success: {
        border: 'border-emerald-400/50 dark:border-emerald-500/40',
        badge: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
        headerBg: 'from-emerald-500 to-teal-500',
        btn: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/25'
    },
    warning: {
        border: 'border-amber-400/50 dark:border-amber-500/40',
        badge: 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
        headerBg: 'from-amber-500 to-orange-500',
        btn: 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25'
    },
    error: {
        border: 'border-rose-400/50 dark:border-rose-500/40',
        badge: 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30',
        headerBg: 'from-rose-600 to-pink-600',
        btn: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/25'
    },
    quiz: {
        border: 'border-indigo-400/60 dark:border-indigo-500/50',
        badge: 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30',
        headerBg: 'from-indigo-600 via-purple-600 to-pink-500',
        btn: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25'
    }
};

export const KineticCanvasBlock = ({ block, onComplete, onStateChange }: any) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const activeTimeoutsRef = useRef<number[]>([]);

    // Serialize initial entities by content so parent re-renders don't wipe in-flight animations
    const entitiesSignature = useMemo(() => JSON.stringify(block?.entities || []), [block?.entities]);
    const initialEntities: KineticEntity[] = useMemo(() => {
        try {
            return JSON.parse(entitiesSignature);
        } catch {
            return [];
        }
    }, [entitiesSignature]);

    const zones: KineticZone[] = useMemo(() => {
        if (Array.isArray(block?.zones)) return block.zones;
        return [];
    }, [block?.zones]);

    const rules: KineticRule[] = useMemo(() => {
        if (Array.isArray(block?.rules)) return block.rules;
        return [];
    }, [block?.rules]);

    const layers: KineticSlideLayer[] = useMemo(() => {
        if (Array.isArray(block?.layers)) return block.layers;
        return [];
    }, [block?.layers]);

    const timelineKeyframes: KineticTimelineKeyframe[] = useMemo(() => {
        if (Array.isArray(block?.timelineKeyframes)) {
            return [...block.timelineKeyframes].sort((a, b) => a.progress - b.progress);
        }
        return [];
    }, [block?.timelineKeyframes]);

    const buildInitialStateMap = (ents: KineticEntity[]) => {
        const map: Record<string, KineticObjectState> = {};
        ents.forEach(e => { map[e.id] = e.initialState || 'normal'; });
        return map;
    };

    const buildInitialSliderMap = (ents: KineticEntity[]) => {
        const map: Record<string, number> = {};
        ents.forEach(e => {
            if (e.entityType === 'slider') map[e.id] = e.sliderMin ?? 0;
        });
        return map;
    };

    const [entities, setEntities] = useState<KineticEntity[]>(initialEntities);
    const [objectStates, setObjectStates] = useState<Record<string, KineticObjectState>>(() => buildInitialStateMap(initialEntities));
    const [animatingEntities, setAnimatingEntities] = useState<Record<string, { duration: number; curve: string }>>({});
    const [activeMotionTrail, setActiveMotionTrail] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

    const [firedRuleIds, setFiredRuleIds] = useState<string[]>([]);
    const [completedLayerIds, setCompletedLayerIds] = useState<string[]>([]);
    const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
    const [layerQuizSelected, setLayerQuizSelected] = useState<string | null>(null);
    const [layerQuizSubmitted, setLayerQuizSubmitted] = useState(false);

    const [snappedMap, setSnappedMap] = useState<Record<string, string>>({});
    const [connections, setConnections] = useState<Record<string, string>>({});
    const [activeConnectorStart, setActiveConnectorStart] = useState<string | null>(null);
    const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(null);
    const [sliderValues, setSliderValues] = useState<Record<string, number>>(() => buildInitialSliderMap(initialEntities));
    const [textValues, setTextValues] = useState<Record<string, string>>({});
    const [multiSelectedIds, setMultiSelectedIds] = useState<string[]>([]);
    const [timelineProgress, setTimelineProgress] = useState<number>(0);

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [activeReaction, setActiveReaction] = useState<string | null>(null);
    const [reactionBanner, setReactionBanner] = useState<string | null>(null);
    const [isVerified, setIsVerified] = useState(false);

    // 🔥 Live Refs so async motion-path timeouts ALWAYS see current state, rules & zones
    const snappedMapRef = useRef<Record<string, string>>(snappedMap);
    useEffect(() => { snappedMapRef.current = snappedMap; }, [snappedMap]);

    const entitiesRef = useRef<KineticEntity[]>(entities);
    useEffect(() => { entitiesRef.current = entities; }, [entities]);

    const rulesRef = useRef<KineticRule[]>(rules);
    useEffect(() => { rulesRef.current = rules; }, [rules]);

    const zonesRef = useRef<KineticZone[]>(zones);
    useEffect(() => { zonesRef.current = zones; }, [zones]);

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            activeTimeoutsRef.current.forEach(t => window.clearTimeout(t));
        };
    }, []);

    // Only reset entities if the underlying block definition genuinely changed
    useEffect(() => {
        const parsed = JSON.parse(entitiesSignature);
        setEntities(parsed);
        entitiesRef.current = parsed;
        setObjectStates(buildInitialStateMap(parsed));
        setSliderValues(buildInitialSliderMap(parsed));
    }, [entitiesSignature]);

    useEffect(() => {
        if (onStateChange) {
            onStateChange({
                entities, snappedMap, objectStates, connections,
                sliderValues, textValues, multiSelectedIds, timelineProgress,
                activeLayerId, isVerified
            });
        }
    }, [entities, snappedMap, objectStates, connections, sliderValues, textValues, multiSelectedIds, timelineProgress, activeLayerId, isVerified]);

    const selectedEntity = entities.find(e => e.id === selectedId) || null;
    const activeLayer = layers.find(l => l.id === activeLayerId) || null;
    const bgThemeKey = block?.backgroundTheme || 'grid';
    const customBgUrl = block?.backgroundUrl || '';
    const isLightTheme = bgThemeKey === 'parchment' || bgThemeKey === 'blank' || bgThemeKey === 'light_grid';

    const activeKeyframe = useMemo(() => {
        if (timelineKeyframes.length === 0) return null;
        let current = timelineKeyframes[0];
        for (const kf of timelineKeyframes) {
            if (timelineProgress >= kf.progress) current = kf;
        }
        return current;
    }, [timelineKeyframes, timelineProgress]);

    const getEntityWithTimeline = (ent: KineticEntity): KineticEntity & { effectiveState: KineticObjectState } => {
        const baseState = objectStates[ent.id] || 'normal';
        if (!activeKeyframe || !Array.isArray(activeKeyframe.entityOverrides)) {
            return { ...ent, effectiveState: baseState };
        }
        const ov = activeKeyframe.entityOverrides.find(o => o.entityId === ent.id);
        if (!ov) return { ...ent, effectiveState: baseState };
        return {
            ...ent,
            x: ov.x !== undefined ? ov.x : ent.x,
            y: ov.y !== undefined ? ov.y : ent.y,
            scale: ov.scale !== undefined ? ov.scale : ent.scale,
            rotation: ov.rotation !== undefined ? ov.rotation : ent.rotation,
            label: ov.labelOverride || ent.label,
            effectiveState: ov.state || baseState
        };
    };

    const triggerCanvasReaction = (reactionType: string, message: string) => {
        if (reactionType) setActiveReaction(reactionType);
        if (message) setReactionBanner(message);
        const tid = window.setTimeout(() => setActiveReaction(null), 2200);
        activeTimeoutsRef.current.push(tid);
    };

    const computeZoneTiledCoords = (targetZone: KineticZone, entityId: string, currentSnapped: Record<string, string>) => {
        const maxCap = targetZone.capacity || (targetZone.acceptedCategory ? 6 : 1);
        const currentOccupants = Object.keys(currentSnapped).filter(
            k => currentSnapped[k] === targetZone.id && k !== entityId
        );
        const slotIdx = currentOccupants.length;
        let snapX = targetZone.x;
        let snapY = targetZone.y;

        if (maxCap > 1) {
            const cols = 2;
            const col = slotIdx % cols;
            const row = Math.floor(slotIdx / cols);
            const offsetX = (col === 0 ? -1 : 1) * Math.min(targetZone.width * 0.22, 9);
            const offsetY = (row - 0.5) * Math.min(targetZone.height * 0.28, 9);
            snapX = Math.max(6, Math.min(94, targetZone.x + offsetX));
            snapY = Math.max(8, Math.min(92, targetZone.y + offsetY));
        }
        return { snapX, snapY, occupantCount: currentOccupants.length, maxCap };
    };

    // 🔥 Evaluate category sorting, sequence order, and cascading on_drop rules whenever an object lands in a zone
    const evaluateZoneArrival = (
        entityId: string,
        matchedZone: KineticZone,
        visitedRuleIds: Set<string> = new Set()
    ) => {
        const currentEntities = entitiesRef.current;
        const currentRules = rulesRef.current;
        const movedEntity = currentEntities.find(e => e.id === entityId);
        if (!movedEntity) return;

        // 1. Check Category Sorting match
        if (matchedZone.acceptedCategory && movedEntity.category) {
            if (matchedZone.acceptedCategory.trim().toLowerCase() === movedEntity.category.trim().toLowerCase()) {
                setObjectStates(prev => ({ ...prev, [entityId]: 'drop_correct' }));
            } else {
                setObjectStates(prev => ({ ...prev, [entityId]: 'drop_incorrect' }));
            }
        }

        // 2. Check Sequence / Ordering match
        if (matchedZone.sequenceOrder !== undefined && movedEntity.sequenceIndex !== undefined) {
            if (matchedZone.sequenceOrder === movedEntity.sequenceIndex) {
                setObjectStates(prev => ({ ...prev, [entityId]: 'drop_correct' }));
            } else {
                setObjectStates(prev => ({ ...prev, [entityId]: 'drop_incorrect' }));
            }
        }

        // 3. Find any cascading on_drop triggers for this entity in this zone (or wildcard empty zoneId)
        const dropRules = currentRules.filter(
            r =>
                (r.event || 'on_drop') === 'on_drop' &&
                r.entityId === entityId &&
                (!r.zoneId || r.zoneId === matchedZone.id) &&
                !visitedRuleIds.has(r.id)
        );

        if (dropRules.length > 0) {
            executeTriggers(dropRules, entityId, visitedRuleIds);
        }
    };

    // 🔥 ANIMATE AN ENTITY ALONG A MOTION PATH (AND CASCADE ZONE ARRIVAL TRIGGERS)
    const animateEntityAlongPath = (
        targetId: string,
        destX: number,
        destY: number,
        options?: {
            scale?: number;
            rotation?: number;
            duration?: number;
            curve?: string;
            snapToZoneId?: string;
            nextState?: KineticObjectState;
            visitedRuleIds?: Set<string>;
        }
    ) => {
        const duration = options?.duration || 850;
        const curve = MOTION_CURVES[options?.curve || 'spring_bounce'] || MOTION_CURVES.spring_bounce;

        const sourceObj = entitiesRef.current.find(e => e.id === targetId);
        if (sourceObj) {
            setActiveMotionTrail({ x1: sourceObj.x, y1: sourceObj.y, x2: destX, y2: destY });
        }

        // Immediately register snap map so capacity calculations for subsequent items are accurate
        if (options?.snapToZoneId) {
            const nextMap = { ...snappedMapRef.current, [targetId]: options.snapToZoneId };
            snappedMapRef.current = nextMap;
            setSnappedMap(nextMap);
        }

        // Make sure hidden/disabled objects become visible before moving
        setObjectStates(prev => ({
            ...prev,
            [targetId]: options?.nextState || (prev[targetId] === 'hidden' || prev[targetId] === 'disabled' ? 'normal' : prev[targetId])
        }));

        // Enable CSS transition AND update coordinates together
        setAnimatingEntities(prev => ({ ...prev, [targetId]: { duration, curve } }));

        const updatedEntities = entitiesRef.current.map(ent => {
            if (ent.id !== targetId) return ent;
            return {
                ...ent,
                x: destX,
                y: destY,
                scale: options?.scale !== undefined ? options.scale : ent.scale,
                rotation: options?.rotation !== undefined ? options.rotation : ent.rotation
            };
        });
        entitiesRef.current = updatedEntities;
        setEntities(updatedEntities);

        // Schedule arrival evaluation right when the glide completes
        const tid = window.setTimeout(() => {
            setAnimatingEntities(prev => {
                const copy = { ...prev };
                delete copy[targetId];
                return copy;
            });
            setActiveMotionTrail(null);

            // Determine if it landed in an explicit snapToZoneId OR within any zone's bounding box
            let landedZone: KineticZone | undefined;
            if (options?.snapToZoneId) {
                landedZone = zonesRef.current.find(z => z.id === options.snapToZoneId);
            } else {
                landedZone = zonesRef.current.find(z => {
                    const halfW = (z.isHotspotPin ? Math.max(z.width, 16) : z.width) / 2;
                    const halfH = (z.isHotspotPin ? Math.max(z.height, 16) : z.height) / 2;
                    return destX >= z.x - halfW && destX <= z.x + halfW && destY >= z.y - halfH && destY <= z.y + halfH;
                });
                if (landedZone) {
                    const nextMap = { ...snappedMapRef.current, [targetId]: landedZone.id };
                    snappedMapRef.current = nextMap;
                    setSnappedMap(nextMap);
                }
            }

            if (landedZone) {
                evaluateZoneArrival(targetId, landedZone, options?.visitedRuleIds || new Set());
            }
        }, duration + 50);

        activeTimeoutsRef.current.push(tid);
    };

    const openSlideLayer = (layerId: string) => {
        setLayerQuizSelected(null);
        setLayerQuizSubmitted(false);
        setActiveLayerId(layerId);
    };

    const handleCloseActiveLayer = () => {
        if (!activeLayer) {
            setActiveLayerId(null);
            return;
        }
        if (activeLayer.hasQuiz && (activeLayer.quizOptions?.length || 0) > 0) {
            if (!layerQuizSubmitted) {
                setLayerQuizSubmitted(true);
                const isCorrect = layerQuizSelected === activeLayer.correctOptionId;
                if (!isCorrect && activeLayer.gateUntilCorrect !== false) return;
            } else {
                const isCorrect = layerQuizSelected === activeLayer.correctOptionId;
                if (!isCorrect && activeLayer.gateUntilCorrect !== false) {
                    setLayerQuizSubmitted(false);
                    setLayerQuizSelected(null);
                    return;
                }
            }
        }

        setCompletedLayerIds(prev => Array.from(new Set([...prev, activeLayer.id])));

        if (activeLayer.onCloseAction === 'change_state' && activeLayer.onCloseTargetEntityId) {
            setObjectStates(prev => ({
                ...prev,
                [activeLayer.onCloseTargetEntityId!]: activeLayer.onCloseTargetState || 'normal'
            }));
        } else if (activeLayer.onCloseAction === 'complete_block') {
            setIsVerified(true);
            if (onComplete) setTimeout(() => onComplete(), 900);
        }

        setActiveLayerId(null);
        setLayerQuizSelected(null);
        setLayerQuizSubmitted(false);
    };

    // 🔥 Execute triggers with full support for destinationZoneId & smart fallback
    const executeTriggers = (
        matchingRules: KineticRule[],
        sourceEntityId: string,
        visitedRuleIds: Set<string> = new Set()
    ) => {
        const unvisited = matchingRules.filter(r => !visitedRuleIds.has(r.id));
        if (unvisited.length === 0) return;

        const nextVisited = new Set(visitedRuleIds);
        unvisited.forEach(r => nextVisited.add(r.id));

        const newlyFiredIds = unvisited.map(r => r.id);
        setFiredRuleIds(prev => Array.from(new Set([...prev, ...newlyFiredIds])));

        const currentZones = zonesRef.current;
        const currentEntities = entitiesRef.current;

        unvisited.forEach(rule => {
            const actionType = rule.action || 'reaction';
            if (rule.message || rule.reaction) {
                triggerCanvasReaction(rule.reaction || 'bounce_glow', rule.message);
            }

            if (actionType === 'show_layer' && rule.targetLayerId) {
                openSlideLayer(rule.targetLayerId);
            } else if (actionType === 'hide_layer') {
                setActiveLayerId(null);
            } else if (actionType === 'change_state') {
                const targetId = rule.targetEntityId || sourceEntityId;
                const nextState = rule.targetState || 'drop_correct';
                setObjectStates(prev => ({ ...prev, [targetId]: nextState }));
            } else if (actionType === 'reaction') {
                setObjectStates(prev => ({
                    ...prev,
                    [sourceEntityId]: rule.reaction === 'shake_error' ? 'drop_incorrect' : 'drop_correct'
                }));
            } else if (actionType === 'move_to_zone') {
                const targetId = rule.targetEntityId || sourceEntityId;
                const targetEnt = currentEntities.find(e => e.id === targetId);

                // 1. Prefer explicit destinationZoneId
                let destZone = rule.destinationZoneId
                    ? currentZones.find(z => z.id === rule.destinationZoneId)
                    : undefined;

                // 2. If no destinationZoneId was set AND targetId is a different object,
                //    check if targetEnt has a matching category bucket or sequence slot!
                if (!destZone && targetId !== sourceEntityId && targetEnt) {
                    if (targetEnt.category) {
                        destZone = currentZones.find(
                            z => z.acceptedCategory && z.acceptedCategory.trim().toLowerCase() === targetEnt.category!.trim().toLowerCase()
                        );
                    }
                    if (!destZone && targetEnt.sequenceIndex !== undefined) {
                        destZone = currentZones.find(z => z.sequenceOrder === targetEnt.sequenceIndex);
                    }
                }

                // 3. Otherwise fall back to rule.zoneId or first available zone
                if (!destZone) {
                    destZone = currentZones.find(z => z.id === rule.zoneId) || currentZones[0];
                }

                if (destZone) {
                    const { snapX, snapY } = computeZoneTiledCoords(destZone, targetId, snappedMapRef.current);
                    animateEntityAlongPath(targetId, snapX, snapY, {
                        scale: rule.motionScale,
                        rotation: rule.motionRotation,
                        duration: rule.motionDuration || 850,
                        curve: rule.motionCurve || 'spring_bounce',
                        snapToZoneId: destZone.id,
                        nextState: rule.targetState || 'drop_correct',
                        visitedRuleIds: nextVisited
                    });
                }
            } else if (actionType === 'animate_motion') {
                const targetId = rule.targetEntityId || sourceEntityId;
                const destX = rule.motionX ?? 50;
                const destY = rule.motionY ?? 40;
                const landingZone = currentZones.find(z => {
                    const halfW = (z.isHotspotPin ? Math.max(z.width, 16) : z.width) / 2;
                    const halfH = (z.isHotspotPin ? Math.max(z.height, 16) : z.height) / 2;
                    return destX >= z.x - halfW && destX <= z.x + halfW && destY >= z.y - halfH && destY <= z.y + halfH;
                });
                let finalX = destX;
                let finalY = destY;
                if (landingZone) {
                    const tiled = computeZoneTiledCoords(landingZone, targetId, snappedMapRef.current);
                    finalX = tiled.snapX;
                    finalY = tiled.snapY;
                }
                animateEntityAlongPath(targetId, finalX, finalY, {
                    scale: rule.motionScale,
                    rotation: rule.motionRotation,
                    duration: rule.motionDuration || 900,
                    curve: rule.motionCurve || 'ease_in_out',
                    snapToZoneId: landingZone?.id,
                    nextState: rule.targetState || 'drop_correct',
                    visitedRuleIds: nextVisited
                });
            } else if (actionType === 'complete_block') {
                setIsVerified(true);
                if (onComplete) setTimeout(() => onComplete(), 1200);
            }
        });
    };

    const handleConnectorNodeTap = (entityId: string) => {
        if (!activeConnectorStart) {
            setActiveConnectorStart(entityId);
            setReactionBanner('Tap another node to link a connector line...');
            return;
        }
        if (activeConnectorStart === entityId) {
            setActiveConnectorStart(null);
            setPointerPos(null);
            return;
        }

        const sourceEnt = entities.find(e => e.id === activeConnectorStart);
        const targetEnt = entities.find(e => e.id === entityId);
        if (!sourceEnt || !targetEnt) return;

        const nextConnections = { ...connections, [sourceEnt.id]: targetEnt.id };
        setConnections(nextConnections);
        setActiveConnectorStart(null);
        setPointerPos(null);

        const isCorrectPair =
            sourceEnt.connectTargetId === targetEnt.id ||
            targetEnt.connectTargetId === sourceEnt.id;

        const connectRules = rulesRef.current.filter(
            r => r.event === 'on_connect' && (r.entityId === sourceEnt.id || r.entityId === targetEnt.id)
        );

        if (connectRules.length > 0) {
            executeTriggers(connectRules, sourceEnt.id);
        } else if (sourceEnt.connectTargetId || targetEnt.connectTargetId) {
            if (isCorrectPair) {
                setObjectStates(prev => ({ ...prev, [sourceEnt.id]: 'drop_correct', [targetEnt.id]: 'drop_correct' }));
                triggerCanvasReaction('bounce_glow', `Connected: ${sourceEnt.label} ➔ ${targetEnt.label}!`);
            } else {
                setObjectStates(prev => ({ ...prev, [sourceEnt.id]: 'drop_incorrect' }));
                triggerCanvasReaction('shake_error', 'Those nodes do not match—tap again to re-link.');
            }
        }
    };

    const handleMultiSelectToggle = (entityId: string) => {
        setMultiSelectedIds(prev => {
            const exists = prev.includes(entityId);
            const next = exists ? prev.filter(id => id !== entityId) : [...prev, entityId];
            setObjectStates(st => ({
                ...st,
                [entityId]: exists ? 'normal' : 'selected'
            }));
            return next;
        });
    };

    const handlePointerDown = (e: React.PointerEvent, entityId: string) => {
        if (isVerified || activeLayerId) return;
        const ent = entities.find(item => item.id === entityId);
        if (!ent) return;

        const currentState = objectStates[entityId] || 'normal';
        if (currentState === 'disabled' || currentState === 'hidden') return;

        e.stopPropagation();
        setSelectedId(entityId);

        const eType = ent.entityType || 'draggable';

        if (eType === 'connector_node') {
            handleConnectorNodeTap(entityId);
            return;
        }

        if (eType === 'multi_select') {
            handleMultiSelectToggle(entityId);
            const clickRules = rulesRef.current.filter(r => r.event === 'on_click' && r.entityId === entityId);
            if (clickRules.length > 0) executeTriggers(clickRules, entityId);
            return;
        }

        if (eType === 'slider' || eType === 'text_input') return;

        const clickRules = rulesRef.current.filter(r => r.event === 'on_click' && r.entityId === entityId);
        if (clickRules.length > 0) {
            executeTriggers(clickRules, entityId);
        } else if (ent.draggable === false) {
            setObjectStates(prev => ({
                ...prev,
                [entityId]: prev[entityId] === 'selected' ? 'normal' : 'selected'
            }));
        }

        if (ent.draggable !== false) {
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            setDraggingId(entityId);
        }
    };

    const handlePointerMove = (e: React.PointerEvent, entityId: string) => {
        if (draggingId !== entityId || !canvasRef.current || isVerified || activeLayerId) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const rawX = ((e.clientX - rect.left) / rect.width) * 100;
        const rawY = ((e.clientY - rect.top) / rect.height) * 100;
        const clampedX = Math.max(5, Math.min(95, rawX));
        const clampedY = Math.max(6, Math.min(94, rawY));

        setEntities(prev => {
            const next = prev.map(ent => ent.id === entityId ? { ...ent, x: clampedX, y: clampedY } : ent);
            entitiesRef.current = next;
            return next;
        });
    };

    const handleCanvasPointerMove = (e: React.PointerEvent) => {
        if (!activeConnectorStart || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        setPointerPos({
            x: ((e.clientX - rect.left) / rect.width) * 100,
            y: ((e.clientY - rect.top) / rect.height) * 100
        });
    };

    const handlePointerUp = (e: React.PointerEvent, entityId: string) => {
        if (draggingId !== entityId) return;
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        setDraggingId(null);

        const movedEntity = entitiesRef.current.find(ent => ent.id === entityId);
        if (!movedEntity) return;

        let matchedZone: KineticZone | null = null;
        for (const z of zonesRef.current) {
            const halfW = (z.isHotspotPin ? Math.max(z.width, 16) : z.width) / 2;
            const halfH = (z.isHotspotPin ? Math.max(z.height, 16) : z.height) / 2;
            if (movedEntity.x >= (z.x - halfW) && movedEntity.x <= (z.x + halfW) &&
                movedEntity.y >= (z.y - halfH) && movedEntity.y <= (z.y + halfH)) {
                matchedZone = z;
                break;
            }
        }

        if (matchedZone) {
            const { snapX, snapY, occupantCount, maxCap } = computeZoneTiledCoords(matchedZone, entityId, snappedMapRef.current);

            if (occupantCount >= maxCap) {
                triggerCanvasReaction('shake_error', `${matchedZone.label} is at full capacity (${maxCap}/${maxCap})!`);
                return;
            }

            // Snap into the zone and immediately evaluate arrival + fire any cascading triggers!
            animateEntityAlongPath(entityId, snapX, snapY, {
                duration: 240,
                curve: 'spring_bounce',
                snapToZoneId: matchedZone.id
            });
        } else {
            const nextSnapped = { ...snappedMapRef.current };
            delete nextSnapped[entityId];
            snappedMapRef.current = nextSnapped;
            setSnappedMap(nextSnapped);
            setObjectStates(prev => ({ ...prev, [entityId]: 'normal' }));
        }
    };

    const updateEntityTransform = (id: string, field: 'scale' | 'rotation', value: number) => {
        if (isVerified) return;
        setEntities(prev => {
            const next = prev.map(ent => ent.id === id ? { ...ent, [field]: value } : ent);
            entitiesRef.current = next;
            return next;
        });
    };

    const handleReset = () => {
        activeTimeoutsRef.current.forEach(t => window.clearTimeout(t));
        activeTimeoutsRef.current = [];
        const fresh = JSON.parse(entitiesSignature);
        entitiesRef.current = fresh;
        setEntities(fresh);
        setObjectStates(buildInitialStateMap(fresh));
        setAnimatingEntities({});
        setActiveMotionTrail(null);
        setSliderValues(buildInitialSliderMap(fresh));
        setTextValues({});
        setMultiSelectedIds([]);
        setConnections({});
        setActiveConnectorStart(null);
        setPointerPos(null);
        setTimelineProgress(0);
        setFiredRuleIds([]);
        setCompletedLayerIds([]);
        setActiveLayerId(null);
        setLayerQuizSelected(null);
        setLayerQuizSubmitted(false);
        snappedMapRef.current = {};
        setSnappedMap({});
        setSelectedId(null);
        setActiveReaction(null);
        setReactionBanner(null);
        setIsVerified(false);
    };

    const ruleStatus = useMemo(() => {
        const checks: boolean[] = [];

        const requiredRules = rules.filter(r => r.isRequired !== false);
        requiredRules.forEach(rule => {
            if (rule.action === 'show_layer' && rule.targetLayerId) {
                checks.push(completedLayerIds.includes(rule.targetLayerId));
            } else if (rule.event === 'on_click' || rule.event === 'on_connect' || rule.action === 'animate_motion' || rule.action === 'move_to_zone') {
                checks.push(firedRuleIds.includes(rule.id));
            } else {
                const isZoneMatched = snappedMap[rule.entityId] === rule.zoneId;
                const ent = entities.find(e => e.id === rule.entityId);
                const scaleOk = (ent?.allowResize && ent.targetScale) ? Math.abs(ent.scale - ent.targetScale) <= 0.25 : true;
                const rotateOk = (ent?.allowRotate && ent.targetRotation !== undefined) ? Math.abs(ent.rotation - ent.targetRotation) <= 15 : true;
                checks.push(isZoneMatched && scaleOk && rotateOk);
            }
        });

        entities.filter(e => e.category).forEach(ent => {
            const zId = snappedMap[ent.id];
            const z = zones.find(zone => zone.id === zId);
            checks.push(Boolean(z?.acceptedCategory && z.acceptedCategory.trim().toLowerCase() === ent.category!.trim().toLowerCase()));
        });

        entities.filter(e => e.sequenceIndex !== undefined).forEach(ent => {
            const zId = snappedMap[ent.id];
            const z = zones.find(zone => zone.id === zId);
            checks.push(Boolean(z && z.sequenceOrder === ent.sequenceIndex));
        });

        entities.filter(e => e.entityType === 'connector_node' && e.connectTargetId).forEach(ent => {
            const connectedTo = connections[ent.id];
            const reverseConnected = Object.keys(connections).find(k => connections[k] === ent.id);
            checks.push(connectedTo === ent.connectTargetId || reverseConnected === ent.connectTargetId);
        });

        entities.filter(e => e.entityType === 'slider' && e.sliderTarget !== undefined).forEach(ent => {
            const val = sliderValues[ent.id] ?? (ent.sliderMin ?? 0);
            const tol = ent.sliderTolerance ?? 0;
            checks.push(Math.abs(val - ent.sliderTarget!) <= tol);
        });

        entities.filter(e => e.entityType === 'text_input' && e.expectedText).forEach(ent => {
            const userTxt = (textValues[ent.id] || '').trim().toLowerCase();
            const validOptions = ent.expectedText!.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
            checks.push(validOptions.includes(userTxt));
        });

        const multiSelectEnts = entities.filter(e => e.entityType === 'multi_select');
        if (multiSelectEnts.length > 0) {
            multiSelectEnts.forEach(ent => {
                const isSelected = multiSelectedIds.includes(ent.id);
                checks.push(ent.isCorrectSelect ? isSelected : !isSelected);
            });
        }

        if (checks.length === 0) {
            const draggableEnts = entities.filter(e => (e.entityType || 'draggable') === 'draggable' && e.draggable !== false);
            const placedCount = Object.keys(snappedMap).length;
            const total = Math.max(1, draggableEnts.length);
            return { completedCount: placedCount, total, allComplete: placedCount >= draggableEnts.length };
        }

        const completedCount = checks.filter(Boolean).length;
        return { completedCount, total: checks.length, allComplete: completedCount === checks.length };
    }, [rules, snappedMap, entities, zones, firedRuleIds, completedLayerIds, connections, sliderValues, textValues, multiSelectedIds]);

    const handleVerifyAndComplete = () => {
        if (ruleStatus.allComplete) {
            setIsVerified(true);
            triggerCanvasReaction(block?.successAnimation || 'chariot_march', 'All Canvas Objectives Verified!');
            if (onComplete) setTimeout(() => onComplete(), 1200);
        } else {
            setReactionBanner(`Keep going! ${ruleStatus.completedCount} of ${ruleStatus.total} interactions aligned.`);
        }
    };

    const activeLayerStyle = LAYER_THEME_STYLES[activeLayer?.theme || (activeLayer?.hasQuiz ? 'quiz' : 'info')] || LAYER_THEME_STYLES.info;
    const isLayerQuizCorrect = activeLayer?.hasQuiz ? layerQuizSelected === activeLayer.correctOptionId : true;
    const showTimeline = Boolean(block?.enableTimeline || timelineKeyframes.length > 0);

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
                            {ruleStatus.completedCount} / {ruleStatus.total} Objectives Aligned
                        </span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                        {String(block?.title || 'Interactive Spatial Assembly')}
                    </h3>
                    {block?.subtitle && (
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{block.subtitle}</p>
                    )}
                </div>
                <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all active:scale-95"
                >
                    <RotateCcw size={14} /> Reset Slide
                </button>
            </div>

            {/* 2D Stage */}
            <div className="p-4 sm:p-6 bg-slate-100 dark:bg-slate-950">
                <div 
                    ref={canvasRef}
                    onPointerDown={() => {
                        setSelectedId(null);
                        setActiveConnectorStart(null);
                        setPointerPos(null);
                    }}
                    onPointerMove={handleCanvasPointerMove}
                    className={`relative w-full aspect-[16/10] min-h-[380px] rounded-[2rem] overflow-hidden border-2 border-slate-200 dark:border-slate-800 shadow-inner select-none touch-none ${KINETIC_BACKGROUNDS[bgThemeKey] || KINETIC_BACKGROUNDS.grid}`}
                    style={customBgUrl ? { backgroundImage: `url(${customBgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                >
                    {/* SVG OVERLAY FOR CONNECTOR LINES & ACTIVE MOTION PATH TRAILS */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-15">
                        {activeMotionTrail && (
                            <g>
                                <line
                                    x1={`${activeMotionTrail.x1}%`}
                                    y1={`${activeMotionTrail.y1}%`}
                                    x2={`${activeMotionTrail.x2}%`}
                                    y2={`${activeMotionTrail.y2}%`}
                                    stroke="#38bdf8"
                                    strokeWidth="3.5"
                                    strokeDasharray="8 6"
                                    className="animate-pulse"
                                />
                                <circle cx={`${activeMotionTrail.x2}%`} cy={`${activeMotionTrail.y2}%`} r="7" fill="#38bdf8" />
                            </g>
                        )}
                        {Object.entries(connections).map(([sourceId, targetId]) => {
                            const sEnt = entities.find(e => e.id === sourceId);
                            const tEnt = entities.find(e => e.id === targetId);
                            if (!sEnt || !tEnt) return null;
                            const isMatch = sEnt.connectTargetId === tEnt.id || tEnt.connectTargetId === sEnt.id;
                            return (
                                <g key={`${sourceId}_${targetId}`}>
                                    <line
                                        x1={`${sEnt.x}%`}
                                        y1={`${sEnt.y}%`}
                                        x2={`${tEnt.x}%`}
                                        y2={`${tEnt.y}%`}
                                        stroke={isMatch ? '#10b981' : '#6366f1'}
                                        strokeWidth="4"
                                        strokeDasharray={isMatch ? undefined : '6 4'}
                                        strokeLinecap="round"
                                    />
                                    <circle cx={`${sEnt.x}%`} cy={`${sEnt.y}%`} r="6" fill="#10b981" />
                                    <circle cx={`${tEnt.x}%`} cy={`${tEnt.y}%`} r="6" fill="#10b981" />
                                </g>
                            );
                        })}
                        {activeConnectorStart && pointerPos && (() => {
                            const sEnt = entities.find(e => e.id === activeConnectorStart);
                            if (!sEnt) return null;
                            return (
                                <line
                                    x1={`${sEnt.x}%`}
                                    y1={`${sEnt.y}%`}
                                    x2={`${pointerPos.x}%`}
                                    y2={`${pointerPos.y}%`}
                                    stroke="#f59e0b"
                                    strokeWidth="3.5"
                                    strokeDasharray="6 6"
                                />
                            );
                        })()}
                    </svg>

                    {reactionBanner && !activeLayer && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-5 py-2.5 rounded-full bg-slate-900/95 text-white backdrop-blur-md shadow-xl border border-white/20 text-xs font-black flex items-center gap-2 animate-in slide-in-from-top-4">
                            <Sparkles size={14} className="text-amber-400 shrink-0" />
                            <span>{reactionBanner}</span>
                        </div>
                    )}

                    {/* Target Snap Zones */}
                    {zones.map((zone) => {
                        const occupants = Object.keys(snappedMap).filter(k => snappedMap[k] === zone.id);
                        const maxCap = zone.capacity || (zone.acceptedCategory ? 6 : 1);

                        if (zone.isHotspotPin) {
                            return (
                                <div
                                    key={zone.id}
                                    style={{ left: `${zone.x}%`, top: `${zone.y}%`, transform: 'translate(-50%, -50%)' }}
                                    className="absolute z-10 pointer-events-none flex flex-col items-center"
                                >
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 shadow-lg transition-all ${
                                        occupants.length > 0
                                            ? 'bg-emerald-500 border-white text-white scale-110'
                                            : 'bg-amber-500/90 border-white text-slate-950 animate-pulse'
                                    }`}>
                                        <span className="text-[10px] font-black">{zone.sequenceOrder ?? '📍'}</span>
                                    </div>
                                    {!zone.invisible && (
                                        <span className="mt-1 px-2 py-0.5 rounded-md bg-slate-900/85 text-white text-[9px] font-black uppercase tracking-wider whitespace-nowrap">
                                            {zone.label}
                                        </span>
                                    )}
                                </div>
                            );
                        }

                        return (
                            <div
                                key={zone.id}
                                style={{ left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.width}%`, height: `${zone.height}%`, transform: 'translate(-50%, -50%)' }}
                                className={`absolute rounded-3xl transition-all duration-300 flex flex-col items-center justify-between p-2.5 text-center pointer-events-none ${
                                    zone.invisible
                                        ? occupants.length > 0 ? 'border-2 border-emerald-400/60 bg-emerald-500/10' : 'border border-transparent'
                                        : occupants.length > 0
                                            ? 'border-2 border-dashed border-emerald-400 bg-emerald-500/15'
                                            : isLightTheme
                                                ? 'border-2 border-dashed border-slate-400/80 bg-white/60 text-slate-700 backdrop-blur-[2px]'
                                                : 'border-2 border-dashed border-slate-600/80 bg-slate-800/40 text-slate-300 backdrop-blur-[2px]'
                                }`}
                            >
                                {!zone.invisible && (
                                    <div className="w-full flex items-center justify-between gap-1 px-1">
                                        {zone.sequenceOrder !== undefined && (
                                            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[9px] font-black flex items-center justify-center shrink-0">
                                                #{zone.sequenceOrder}
                                            </span>
                                        )}
                                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest opacity-90 truncate flex-1">
                                            {zone.label}
                                        </span>
                                        {maxCap > 1 && (
                                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-slate-900/40 text-white shrink-0">
                                                {occupants.length}/{maxCap}
                                            </span>
                                        )}
                                    </div>
                                )}
                                {zone.sublabel && !zone.invisible && (
                                    <span className="text-[8px] font-bold opacity-60 mt-auto">{zone.sublabel}</span>
                                )}
                            </div>
                        );
                    })}

                    {/* Interactive Entities */}
                    {entities.map((rawEnt) => {
                        const ent = getEntityWithTimeline(rawEnt);
                        const st = ent.effectiveState;
                        if (st === 'hidden') return null;

                        const eType = ent.entityType || 'draggable';
                        const isSelected = selectedId === ent.id || st === 'selected' || multiSelectedIds.includes(ent.id) || activeConnectorStart === ent.id;
                        const isDragging = draggingId === ent.id;
                        const isSnapped = Boolean(snappedMap[ent.id]);
                        const isDisabled = st === 'disabled';
                        const animConfig = animatingEntities[ent.id];

                        let colorClasses = KINETIC_COLORS[ent.color || 'indigo'] || KINETIC_COLORS.indigo;
                        if (st === 'drop_correct') colorClasses = KINETIC_COLORS.emerald;
                        if (st === 'drop_incorrect') colorClasses = KINETIC_COLORS.rose;

                        if (eType === 'slider') {
                            const min = ent.sliderMin ?? 0;
                            const max = ent.sliderMax ?? 100;
                            const step = ent.sliderStep ?? 1;
                            const val = sliderValues[ent.id] ?? min;
                            const isTargetMet = ent.sliderTarget !== undefined && Math.abs(val - ent.sliderTarget) <= (ent.sliderTolerance ?? 0);

                            return (
                                <div
                                    key={ent.id}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    style={{ left: `${ent.x}%`, top: `${ent.y}%`, transform: 'translate(-50%, -50%)' }}
                                    className={`absolute z-20 p-3.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-2 shadow-xl min-w-[210px] ${
                                        isTargetMet ? 'border-emerald-400' : 'border-slate-200 dark:border-slate-700'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-2 mb-1.5">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">{ent.label}</span>
                                        <span className={`text-xs font-black tabular-nums px-2 py-0.5 rounded-lg ${isTargetMet ? 'bg-emerald-500 text-white' : 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300'}`}>
                                            {val}{ent.sliderUnit || ''}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min={min}
                                        max={max}
                                        step={step}
                                        value={val}
                                        onChange={(e) => setSliderValues(prev => ({ ...prev, [ent.id]: parseFloat(e.target.value) }))}
                                        className="w-full accent-indigo-600 cursor-pointer"
                                    />
                                    <div className="flex justify-between text-[8px] font-bold text-slate-400 mt-0.5">
                                        <span>{min}{ent.sliderUnit || ''}</span>
                                        <span>{max}{ent.sliderUnit || ''}</span>
                                    </div>
                                </div>
                            );
                        }

                        if (eType === 'text_input') {
                            const currentTxt = textValues[ent.id] || '';
                            const validList = (ent.expectedText || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
                            const isTxtMatched = validList.length > 0 && validList.includes(currentTxt.trim().toLowerCase());

                            return (
                                <div
                                    key={ent.id}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    style={{ left: `${ent.x}%`, top: `${ent.y}%`, transform: 'translate(-50%, -50%)' }}
                                    className={`absolute z-20 p-2.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-2 shadow-xl min-w-[170px] ${
                                        isTxtMatched ? 'border-emerald-400 ring-2 ring-emerald-400/30' : 'border-slate-300 dark:border-slate-700'
                                    }`}
                                >
                                    {ent.label && (
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                                            {ent.label}
                                        </label>
                                    )}
                                    <div className="flex items-center gap-1.5">
                                        <input
                                            type="text"
                                            value={currentTxt}
                                            onChange={(e) => setTextValues(prev => ({ ...prev, [ent.id]: e.target.value }))}
                                            placeholder={ent.placeholder || 'Type answer...'}
                                            className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-black text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                                        />
                                        {isTxtMatched && <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />}
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div
                                key={ent.id}
                                onPointerDown={(e) => handlePointerDown(e, ent.id)}
                                onPointerMove={(e) => handlePointerMove(e, ent.id)}
                                onPointerUp={(e) => handlePointerUp(e, ent.id)}
                                style={{
                                    left: `${ent.x}%`,
                                    top: `${ent.y}%`,
                                    width: ent.width ? `${ent.width}px` : undefined,
                                    transform: `translate(-50%, -50%) scale(${ent.scale || 1}) rotate(${ent.rotation || 0}deg)`,
                                    transition: isDragging
                                        ? 'none'
                                        : animConfig
                                            ? `left ${animConfig.duration}ms ${animConfig.curve}, top ${animConfig.duration}ms ${animConfig.curve}, transform ${animConfig.duration}ms ${animConfig.curve}`
                                            : showTimeline
                                                ? 'left 320ms ease-out, top 320ms ease-out, transform 320ms ease-out'
                                                : 'transform 180ms ease-out, box-shadow 180ms ease-out',
                                    touchAction: 'none'
                                }}
                                className={`absolute z-20 select-none ${
                                    ent.imageUrl
                                        ? 'p-2 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-2 border-slate-200 dark:border-slate-700 shadow-xl'
                                        : `px-4 py-2.5 rounded-2xl border-2 shadow-xl ${colorClasses}`
                                } ${isDisabled ? 'opacity-45 grayscale cursor-not-allowed' : 'cursor-pointer'} ${
                                    isDragging ? 'z-30 shadow-2xl ring-4 ring-white/50 scale-105' : ''
                                } ${animConfig ? 'z-30 ring-4 ring-cyan-300 shadow-2xl' : ''} ${
                                    isSelected ? 'ring-4 ring-amber-300 dark:ring-indigo-400 scale-105' : ''
                                }`}
                            >
                                {ent.imageUrl ? (
                                    <div className="flex flex-col items-center text-center gap-1.5">
                                        <img
                                            src={ent.imageUrl}
                                            alt={ent.label}
                                            draggable={false}
                                            className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-xl pointer-events-none select-none"
                                        />
                                        {ent.label && (
                                            <span className="text-[11px] font-black text-slate-800 dark:text-white px-1.5 leading-tight">
                                                {ent.label}
                                            </span>
                                        )}
                                        {ent.sublabel && (
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                                {ent.sublabel}
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 whitespace-nowrap">
                                        {eType === 'connector_node' ? (
                                            <span className="w-3.5 h-3.5 rounded-full bg-white border-2 border-indigo-600 shrink-0" />
                                        ) : eType === 'multi_select' ? (
                                            <span className={`w-4 h-4 rounded-md border-2 flex items-center justify-center ${
                                                multiSelectedIds.includes(ent.id) ? 'bg-white text-indigo-600 border-white' : 'border-white/60'
                                            }`}>
                                                {multiSelectedIds.includes(ent.id) && <Check size={11} strokeWidth={3} />}
                                            </span>
                                        ) : ent.draggable !== false ? (
                                            <Move size={13} className="opacity-70 shrink-0" />
                                        ) : null}

                                        <div className="text-left">
                                            <div className="font-black text-xs sm:text-sm leading-tight">{ent.label}</div>
                                            {ent.sublabel && <div className="text-[9px] font-bold uppercase tracking-wider opacity-80">{ent.sublabel}</div>}
                                        </div>
                                        {(isSnapped || st === 'drop_correct') && <CheckCircle2 size={14} className="text-white shrink-0 ml-1" />}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* STORYLINE 360 SLIDE LAYER OVERLAY */}
                    {activeLayer && (
                        <div
                            onPointerDown={(e) => e.stopPropagation()}
                            className="absolute inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
                        >
                            <div className={`relative w-full max-w-lg max-h-[92%] overflow-y-auto custom-scrollbar bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-[2rem] border-2 ${activeLayerStyle.border} shadow-2xl p-6 sm:p-7 text-left animate-in zoom-in-95 duration-200`}>
                                <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${activeLayerStyle.headerBg}`} />
                                <div className="flex items-center justify-between gap-3 mb-4">
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${activeLayerStyle.badge}`}>
                                        <Layers size={11} /> {activeLayer.name || 'Slide Layer'}
                                    </span>
                                    {(!activeLayer.hasQuiz || activeLayer.gateUntilCorrect === false) && (
                                        <button type="button" onClick={() => setActiveLayerId(null)} className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500">
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                                {activeLayer.imageUrl && (
                                    <div className="mb-4 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-40 bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
                                        <img src={activeLayer.imageUrl} alt={activeLayer.title} className="w-full h-full object-contain max-h-40" />
                                    </div>
                                )}
                                <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">{activeLayer.title}</h4>
                                {activeLayer.body && <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed mb-5 whitespace-pre-wrap">{activeLayer.body}</p>}

                                {activeLayer.hasQuiz && Array.isArray(activeLayer.quizOptions) && activeLayer.quizOptions.length > 0 && (
                                    <div className="mb-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                                        {activeLayer.quizQuestion && <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-white mb-2">{activeLayer.quizQuestion}</p>}
                                        <div className="space-y-2">
                                            {activeLayer.quizOptions.map((opt) => {
                                                const isPicked = layerQuizSelected === opt.id;
                                                const isRight = opt.id === activeLayer.correctOptionId;
                                                let btnStyle = 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200';
                                                if (layerQuizSubmitted) {
                                                    if (isRight) btnStyle = 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-500 text-emerald-800 dark:text-emerald-200';
                                                    else if (isPicked) btnStyle = 'bg-rose-50 dark:bg-rose-500/20 border-rose-500 text-rose-700 dark:text-rose-200';
                                                } else if (isPicked) {
                                                    btnStyle = 'bg-indigo-50 dark:bg-indigo-500/20 border-indigo-500 text-indigo-700 dark:text-indigo-200';
                                                }
                                                return (
                                                    <button
                                                        key={opt.id}
                                                        type="button"
                                                        onClick={() => { setLayerQuizSelected(opt.id); setLayerQuizSubmitted(false); }}
                                                        className={`w-full p-3 rounded-xl border-2 text-left text-xs font-bold transition-all flex items-center justify-between gap-2 ${btnStyle}`}
                                                    >
                                                        <span>{opt.text}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    disabled={Boolean(activeLayer.hasQuiz && !layerQuizSelected)}
                                    onClick={handleCloseActiveLayer}
                                    className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 ${activeLayerStyle.btn}`}
                                >
                                    {activeLayer.buttonLabel || 'Continue'} <ArrowRight size={15} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* CAUSE-AND-EFFECT TIMELINE SCRUBBER BAR */}
                {showTimeline && (
                    <div className="mt-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-2.5">
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                                <Zap size={13} /> Process & Cause-Effect Timeline Scrubber ({timelineProgress}%)
                            </span>
                            {activeKeyframe && (
                                <span className="text-xs font-black text-slate-800 dark:text-white">
                                    {activeKeyframe.title}
                                </span>
                            )}
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            value={timelineProgress}
                            onChange={(e) => setTimelineProgress(parseInt(e.target.value))}
                            className="w-full accent-indigo-600 cursor-pointer"
                        />
                        {activeKeyframe?.description && (
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                                {activeKeyframe.description}
                            </p>
                        )}
                    </div>
                )}

                {/* Transform Controls Dock (Student View Scale & Rotate) */}
                {selectedEntity && !activeLayer && (selectedEntity.allowResize !== false || selectedEntity.allowRotate) && (
                    <div className="mt-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-6">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                            Transform: {selectedEntity.label}
                        </span>
                        <div className="flex flex-wrap items-center gap-6 flex-1 justify-end">
                            {selectedEntity.allowResize !== false && (
                                <div className="flex items-center gap-3 min-w-[170px]">
                                    <Maximize2 size={14} className="text-slate-400" />
                                    <input type="range" min="0.5" max="2.2" step="0.1" value={selectedEntity.scale || 1} onChange={(e) => updateEntityTransform(selectedEntity.id, 'scale', parseFloat(e.target.value))} className="flex-1 accent-indigo-600 cursor-pointer" />
                                    <span className="text-xs font-black text-slate-700 dark:text-slate-200 tabular-nums w-9">{(selectedEntity.scale || 1).toFixed(1)}x</span>
                                </div>
                            )}
                            {selectedEntity.allowRotate && (
                                <div className="flex items-center gap-3 min-w-[170px]">
                                    <RotateCw size={14} className="text-slate-400" />
                                    <input type="range" min="-180" max="180" step="5" value={selectedEntity.rotation || 0} onChange={(e) => updateEntityTransform(selectedEntity.id, 'rotation', parseInt(e.target.value))} className="flex-1 accent-indigo-600 cursor-pointer" />
                                    <span className="text-xs font-black text-slate-700 dark:text-slate-200 tabular-nums w-10">{selectedEntity.rotation || 0}°</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                <span className="text-xs font-bold text-slate-500">
                    {ruleStatus.allComplete ? '✨ All spatial interactions & checks completed!' : 'Complete the canvas interactions above, then click Verify.'}
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
//  8. KINETIC CANVAS BUILDER (Complete Studio: Image Uploads, Theme, Resize & Motion)
// ============================================================================
export const KineticCanvasBuilder = ({ block, onChange }: any) => {
    const [activeTab, setActiveTab] = useState<'canvas' | 'timeline' | 'layers' | 'rules' | 'preview'>('canvas');
    const [selectedItem, setSelectedItem] = useState<{ type: 'entity' | 'zone', id: string } | null>(null);
    const [draggingTarget, setDraggingTarget] = useState<{ type: 'entity' | 'zone', id: string } | null>(null);
    const editorCanvasRef = useRef<HTMLDivElement>(null);
    const bgFileInputRef = useRef<HTMLInputElement>(null);
    const objFileInputRef = useRef<HTMLInputElement>(null);
    const selectedObjImageInputRef = useRef<HTMLInputElement>(null);

    const entities: KineticEntity[] = Array.isArray(block?.entities) ? block.entities : [];
    const zones: KineticZone[] = Array.isArray(block?.zones) ? block.zones : [];
    const rules: KineticRule[] = Array.isArray(block?.rules) ? block.rules : [];
    const layers: KineticSlideLayer[] = Array.isArray(block?.layers) ? block.layers : [];
    const timelineKeyframes: KineticTimelineKeyframe[] = Array.isArray(block?.timelineKeyframes) ? block.timelineKeyframes : [];

    const updateBlock = (patch: any) => {
        onChange({ ...block, type: 'kinetic_canvas', entities, zones, rules, layers, timelineKeyframes, ...patch });
    };

    const handleImageFileUpload = (file: File, onResult: (dataUrl: string) => void) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxDim = 900;
                let w = img.width;
                let h = img.height;
                if (w > maxDim || h > maxDim) {
                    if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
                    else { w = Math.round((w * maxDim) / h); h = maxDim; }
                }
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, w, h);
                onResult(canvas.toDataURL('image/webp', 0.82));
            };
            img.src = String(ev.target?.result || '');
        };
        reader.readAsDataURL(file);
    };

    const handleEditorPointerDown = (e: React.PointerEvent, type: 'entity' | 'zone', id: string) => {
        e.stopPropagation();
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        setSelectedItem({ type, id });
        setDraggingTarget({ type, id });
    };

    const handleEditorPointerMove = (e: React.PointerEvent) => {
        if (!draggingTarget || !editorCanvasRef.current) return;
        const rect = editorCanvasRef.current.getBoundingClientRect();
        const x = Math.round(Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100)));
        const y = Math.round(Math.max(6, Math.min(94, ((e.clientY - rect.top) / rect.height) * 100)));

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

    const addEntityByType = (entityType: KineticEntityType, withImageUrl?: string) => {
        const newId = `ent_${Date.now()}`;
        const base: KineticEntity = {
            id: newId,
            entityType,
            label:
                withImageUrl ? 'Sprite Object' :
                entityType === 'connector_node' ? `Node ${entities.length + 1}` :
                entityType === 'slider' ? 'Force Slider' :
                entityType === 'text_input' ? 'Label Prompt' :
                entityType === 'multi_select' ? 'Selectable Option' :
                `Object ${entities.length + 1}`,
            imageUrl: withImageUrl || '',
            color: entityType === 'connector_node' ? 'cyan' : entityType === 'multi_select' ? 'amber' : 'indigo',
            x: 50,
            y: 78,
            scale: 1,
            rotation: 0,
            draggable: entityType === 'draggable' || entityType === 'hotspot_label',
            initialState: 'normal',
            allowResize: true,
            allowRotate: true,
            sliderMin: 0,
            sliderMax: 100,
            sliderStep: 5,
            sliderTarget: 50,
            expectedText: 'answer',
            isCorrectSelect: true
        };
        updateBlock({ entities: [...entities, base] });
        setSelectedItem({ type: 'entity', id: newId });
    };

    const addZoneByType = (mode: 'bucket' | 'sequence' | 'hotspot') => {
        const newId = `zone_${Date.now()}`;
        const nextOrder = zones.filter(z => z.sequenceOrder !== undefined).length + 1;
        const newZone: KineticZone = {
            id: newId,
            label:
                mode === 'bucket' ? 'Category Bucket' :
                mode === 'sequence' ? `Step ${nextOrder}` :
                `Pin ${zones.length + 1}`,
            x: 50,
            y: 35,
            width: mode === 'hotspot' ? 14 : 28,
            height: mode === 'hotspot' ? 14 : 26,
            capacity: mode === 'bucket' ? 4 : 1,
            acceptedCategory: mode === 'bucket' ? 'group_a' : undefined,
            sequenceOrder: mode === 'sequence' ? nextOrder : undefined,
            isHotspotPin: mode === 'hotspot'
        };
        updateBlock({ zones: [...zones, newZone] });
        setSelectedItem({ type: 'zone', id: newId });
    };

    const clearToBlankCanvas = () => {
        updateBlock({
            title: block?.title || 'Interactive Slide Canvas',
            subtitle: 'Drag objects or click interactive elements on the slide.',
            backgroundTheme: 'blank',
            backgroundUrl: '',
            entities: [],
            zones: [],
            rules: [],
            layers: [],
            timelineKeyframes: []
        });
        setSelectedItem(null);
    };

    const activeEntity = selectedItem?.type === 'entity' ? entities.find(e => e.id === selectedItem.id) : null;
    const activeZone = selectedItem?.type === 'zone' ? zones.find(z => z.id === selectedItem.id) : null;
    const bgThemeKey = block?.backgroundTheme || 'grid';

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-indigo-100 dark:border-slate-800 p-6 space-y-6 shadow-xl">
            <input
                ref={bgFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageFileUpload(file, (dataUrl) => updateBlock({ backgroundUrl: dataUrl }));
                }}
            />
            <input
                ref={objFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageFileUpload(file, (dataUrl) => addEntityByType('draggable', dataUrl));
                }}
            />
            <input
                ref={selectedObjImageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && activeEntity) {
                        handleImageFileUpload(file, (dataUrl) => {
                            updateBlock({
                                entities: entities.map(i => i.id === activeEntity.id ? { ...i, imageUrl: dataUrl } : i)
                            });
                        });
                    }
                }}
            />

            {/* TOP STUDIO BAR */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                        Multi-Modal Kinetic Studio
                    </span>
                    <h4 className="text-lg font-black text-slate-800 dark:text-white mt-1">
                        Sorting, Sequencing, Motion Paths, Sliders & Timeline
                    </h4>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={clearToBlankCanvas}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-wider"
                    >
                        Clear to Blank
                    </button>

                    <div className="flex flex-wrap bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                        <button type="button" onClick={() => setActiveTab('canvas')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase ${activeTab === 'canvas' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
                            1. Stage ({entities.length + zones.length})
                        </button>
                        <button type="button" onClick={() => setActiveTab('timeline')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase ${activeTab === 'timeline' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
                            2. Timeline ({timelineKeyframes.length})
                        </button>
                        <button type="button" onClick={() => setActiveTab('layers')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase ${activeTab === 'layers' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
                            3. Layers ({layers.length})
                        </button>
                        <button type="button" onClick={() => setActiveTab('rules')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase ${activeTab === 'rules' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
                            4. Triggers & Motion ({rules.length})
                        </button>
                        <button type="button" onClick={() => setActiveTab('preview')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase ${activeTab === 'preview' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'}`}>
                            5. Play
                        </button>
                    </div>
                </div>
            </div>

            {/* SLIDE TITLE, BACKGROUND THEME & IMAGE UPLOADER BAR */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="md:col-span-4">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Slide Title / Prompt</label>
                    <input
                        type="text"
                        value={block?.title || ''}
                        onChange={(e) => updateBlock({ title: e.target.value })}
                        placeholder="Slide instructions..."
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                    />
                </div>
                <div className="md:col-span-3">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Canvas Background Theme</label>
                    <select
                        value={bgThemeKey}
                        onChange={(e) => updateBlock({ backgroundTheme: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white outline-none"
                    >
                        <option value="blank">Clean Blank White/Dark</option>
                        <option value="light_grid">Light Blueprint Grid</option>
                        <option value="grid">Dark Blueprint Grid</option>
                        <option value="parchment">Ancient Parchment</option>
                        <option value="roman_road">Roman Stone</option>
                        <option value="physics_lab">Physics Vector Lab</option>
                    </select>
                </div>
                <div className="md:col-span-5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Custom Background Image (URL or Upload)</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={block?.backgroundUrl || ''}
                            onChange={(e) => updateBlock({ backgroundUrl: e.target.value })}
                            placeholder="Paste image URL or click Upload BG ->"
                            className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => bgFileInputRef.current?.click()}
                            className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider shrink-0"
                        >
                            Upload BG
                        </button>
                        {block?.backgroundUrl && (
                            <button
                                type="button"
                                onClick={() => updateBlock({ backgroundUrl: '' })}
                                className="px-2.5 py-2 rounded-xl bg-rose-100 text-rose-600 text-[10px] font-black"
                                title="Clear Background Image"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* TAB 1: STAGE & MULTI-MODAL INSERTION PALETTE */}
            {activeTab === 'canvas' && (
                <div className="space-y-5">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-1">Add Zone:</span>
                        <button type="button" onClick={() => addZoneByType('bucket')} className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase">+ Category Bucket</button>
                        <button type="button" onClick={() => addZoneByType('sequence')} className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-black uppercase">+ Sequence Slot</button>
                        <button type="button" onClick={() => addZoneByType('hotspot')} className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black uppercase">+ 📍 Hotspot Pin</button>

                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mr-1">Add Object:</span>
                        <button type="button" onClick={() => addEntityByType('draggable')} className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase">+ Draggable</button>
                        <button type="button" onClick={() => objFileInputRef.current?.click()} className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase">+ 🖼️ Image Sprite</button>
                        <button type="button" onClick={() => addEntityByType('connector_node')} className="px-3 py-1.5 rounded-xl bg-cyan-600 text-white text-[10px] font-black uppercase">+ Connector</button>
                        <button type="button" onClick={() => addEntityByType('slider')} className="px-3 py-1.5 rounded-xl bg-slate-800 text-white text-[10px] font-black uppercase">+ Slider</button>
                        <button type="button" onClick={() => addEntityByType('text_input')} className="px-3 py-1.5 rounded-xl bg-slate-800 text-white text-[10px] font-black uppercase">+ Text Input</button>
                        <button type="button" onClick={() => addEntityByType('multi_select')} className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-[10px] font-black uppercase">+ Multi-Select</button>
                    </div>

                    {/* WYSIWYG STAGE WITH MOTION PATH VECTOR PREVIEW */}
                    <div
                        ref={editorCanvasRef}
                        onPointerDown={() => setSelectedItem(null)}
                        onPointerMove={handleEditorPointerMove}
                        onPointerUp={handleEditorPointerUp}
                        className={`relative w-full aspect-[16/10] min-h-[340px] rounded-[2rem] border-2 border-slate-300 dark:border-slate-700 overflow-hidden select-none touch-none ${KINETIC_BACKGROUNDS[bgThemeKey] || KINETIC_BACKGROUNDS.grid}`}
                        style={block?.backgroundUrl ? { backgroundImage: `url(${block.backgroundUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                    >
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                            {rules.filter(r => r.action === 'animate_motion' || r.action === 'move_to_zone').map(r => {
                                const targetObj = entities.find(e => e.id === (r.targetEntityId || r.entityId));
                                if (!targetObj) return null;
                                const destZoneId = r.destinationZoneId || r.zoneId;
                                const destZone = r.action === 'move_to_zone' ? zones.find(z => z.id === destZoneId) : null;
                                const endX = destZone ? destZone.x : (r.motionX ?? 50);
                                const endY = destZone ? destZone.y : (r.motionY ?? 40);
                                return (
                                    <g key={`mp_${r.id}`}>
                                        <line
                                            x1={`${targetObj.x}%`}
                                            y1={`${targetObj.y}%`}
                                            x2={`${endX}%`}
                                            y2={`${endY}%`}
                                            stroke="#f59e0b"
                                            strokeWidth="2.5"
                                            strokeDasharray="6 4"
                                        />
                                        <circle cx={`${endX}%`} cy={`${endY}%`} r="5" fill="#f59e0b" />
                                    </g>
                                );
                            })}
                        </svg>

                        {zones.map(z => (
                            <div
                                key={z.id}
                                onPointerDown={(e) => handleEditorPointerDown(e, 'zone', z.id)}
                                style={{ left: `${z.x}%`, top: `${z.y}%`, width: `${z.width}%`, height: `${z.height}%`, transform: 'translate(-50%, -50%)' }}
                                className={`absolute rounded-2xl border-2 border-dashed border-emerald-400 bg-emerald-500/15 text-emerald-200 flex flex-col items-center justify-center p-2 cursor-move ${selectedItem?.id === z.id ? 'ring-4 ring-indigo-500' : ''}`}
                            >
                                <span className="text-[10px] font-black uppercase bg-black/50 px-2 py-0.5 rounded">
                                    {z.isHotspotPin ? `📍 ${z.label}` : z.sequenceOrder ? `#${z.sequenceOrder} ${z.label}` : z.label}
                                </span>
                                <span className="text-[8px] bg-black/40 text-white px-1.5 rounded mt-1">
                                    {z.width}% × {z.height}% (Cap: {z.capacity ?? 1})
                                </span>
                            </div>
                        ))}

                        {entities.map(ent => {
                            const colorClasses = KINETIC_COLORS[ent.color || 'indigo'] || KINETIC_COLORS.indigo;
                            return (
                                <div
                                    key={ent.id}
                                    onPointerDown={(e) => handleEditorPointerDown(e, 'entity', ent.id)}
                                    style={{
                                        left: `${ent.x}%`,
                                        top: `${ent.y}%`,
                                        transform: `translate(-50%, -50%) scale(${ent.scale || 1}) rotate(${ent.rotation || 0}deg)`
                                    }}
                                    className={`absolute z-20 cursor-move transition-shadow ${
                                        ent.imageUrl
                                            ? 'p-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 border-2 border-indigo-300 shadow-xl'
                                            : `px-3.5 py-2 rounded-2xl border-2 shadow-lg ${colorClasses}`
                                    } ${selectedItem?.id === ent.id ? 'ring-4 ring-amber-400 z-30' : ''}`}
                                >
                                    {ent.imageUrl ? (
                                        <div className="flex flex-col items-center gap-1">
                                            <img src={ent.imageUrl} alt={ent.label} draggable={false} className="w-16 h-16 object-contain rounded-lg pointer-events-none" />
                                            <span className="text-[10px] font-black text-slate-800 dark:text-white">{ent.label}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                                            <Move size={12} />
                                            <span className="text-xs font-black">{ent.label}</span>
                                            <span className="text-[8px] uppercase bg-black/30 px-1.5 py-0.5 rounded">{ent.entityType || 'drag'}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* FULL OBJECT INSPECTOR */}
                    {activeEntity && (
                        <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-950 border-2 border-indigo-200 dark:border-slate-800 space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                                <span className="text-xs font-black uppercase tracking-widest text-indigo-600">
                                    Editing {activeEntity.entityType || 'draggable'}: {activeEntity.label}
                                </span>
                                <button type="button" onClick={() => { updateBlock({ entities: entities.filter(e => e.id !== activeEntity.id) }); setSelectedItem(null); }} className="text-rose-500 text-xs font-black flex items-center gap-1">
                                    <Trash2 size={13} /> Delete Object
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                                <div>
                                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Primary Label</label>
                                    <input type="text" value={activeEntity.label} onChange={(e) => updateBlock({ entities: entities.map(i => i.id === activeEntity.id ? { ...i, label: e.target.value } : i) })} className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-black" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Sublabel / Note</label>
                                    <input type="text" value={activeEntity.sublabel || ''} onChange={(e) => updateBlock({ entities: entities.map(i => i.id === activeEntity.id ? { ...i, sublabel: e.target.value } : i) })} className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Interaction Mode</label>
                                    <select value={activeEntity.entityType || 'draggable'} onChange={(e) => updateBlock({ entities: entities.map(i => i.id === activeEntity.id ? { ...i, entityType: e.target.value as any } : i) })} className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold">
                                        <option value="draggable">Draggable / Button</option>
                                        <option value="connector_node">Connector Line Node</option>
                                        <option value="slider">Slider / Number-Line</option>
                                        <option value="text_input">Text-Entry Field</option>
                                        <option value="multi_select">Multi-Select Card</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Color Theme</label>
                                    <select value={activeEntity.color || 'indigo'} onChange={(e) => updateBlock({ entities: entities.map(i => i.id === activeEntity.id ? { ...i, color: e.target.value as any } : i) })} className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold">
                                        <option value="indigo">Indigo</option>
                                        <option value="emerald">Emerald</option>
                                        <option value="amber">Amber</option>
                                        <option value="rose">Rose</option>
                                        <option value="cyan">Cyan</option>
                                        <option value="slate">Slate</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Initial State</label>
                                    <select value={activeEntity.initialState || 'normal'} onChange={(e) => updateBlock({ entities: entities.map(i => i.id === activeEntity.id ? { ...i, initialState: e.target.value as any } : i) })} className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold">
                                        <option value="normal">Normal (Visible)</option>
                                        <option value="hidden">Hidden</option>
                                        <option value="disabled">Disabled</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-200/70 dark:border-slate-800">
                                <div>
                                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">
                                        Object Scale / Size ({(activeEntity.scale || 1).toFixed(1)}x)
                                    </label>
                                    <input
                                        type="range"
                                        min="0.4"
                                        max="2.5"
                                        step="0.1"
                                        value={activeEntity.scale || 1}
                                        onChange={(e) => updateBlock({ entities: entities.map(i => i.id === activeEntity.id ? { ...i, scale: parseFloat(e.target.value) } : i) })}
                                        className="w-full accent-indigo-600 cursor-pointer mt-2"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">
                                        Object Rotation ({activeEntity.rotation || 0}°)
                                    </label>
                                    <input
                                        type="range"
                                        min="-180"
                                        max="180"
                                        step="5"
                                        value={activeEntity.rotation || 0}
                                        onChange={(e) => updateBlock({ entities: entities.map(i => i.id === activeEntity.id ? { ...i, rotation: parseInt(e.target.value) } : i) })}
                                        className="w-full accent-indigo-600 cursor-pointer mt-2"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Object Sprite Image (URL or Upload)</label>
                                    <div className="flex gap-1.5">
                                        <input
                                            type="text"
                                            value={activeEntity.imageUrl || ''}
                                            onChange={(e) => updateBlock({ entities: entities.map(i => i.id === activeEntity.id ? { ...i, imageUrl: e.target.value } : i) })}
                                            placeholder="Image URL..."
                                            className="flex-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => selectedObjImageInputRef.current?.click()}
                                            className="px-2.5 py-1.5 rounded-xl bg-indigo-600 text-white text-[9px] font-black uppercase shrink-0"
                                        >
                                            Upload
                                        </button>
                                        {activeEntity.imageUrl && (
                                            <button
                                                type="button"
                                                onClick={() => updateBlock({ entities: entities.map(i => i.id === activeEntity.id ? { ...i, imageUrl: '' } : i) })}
                                                className="px-2 py-1.5 rounded-xl bg-rose-100 text-rose-600 text-xs font-black"
                                            >
                                                <X size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-200/70 dark:border-slate-800">
                                <div>
                                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Sort Category Tag</label>
                                    <input type="text" value={activeEntity.category || ''} onChange={(e) => updateBlock({ entities: entities.map(i => i.id === activeEntity.id ? { ...i, category: e.target.value } : i) })} placeholder="e.g., noun, verb" className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Sequence Order #</label>
                                    <input type="number" value={activeEntity.sequenceIndex ?? ''} onChange={(e) => updateBlock({ entities: entities.map(i => i.id === activeEntity.id ? { ...i, sequenceIndex: e.target.value ? parseInt(e.target.value) : undefined } : i) })} placeholder="e.g., 1, 2, 3" className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold" />
                                </div>
                                <div className="md:col-span-2 flex flex-wrap items-center gap-4 pt-4 text-xs font-bold text-slate-600 dark:text-slate-300">
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={activeEntity.draggable !== false}
                                            onChange={(e) => updateBlock({ entities: entities.map(i => i.id === activeEntity.id ? { ...i, draggable: e.target.checked } : i) })}
                                        />
                                        Draggable
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={activeEntity.allowResize !== false}
                                            onChange={(e) => updateBlock({ entities: entities.map(i => i.id === activeEntity.id ? { ...i, allowResize: e.target.checked } : i) })}
                                        />
                                        Learner Can Resize
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(activeEntity.allowRotate)}
                                            onChange={(e) => updateBlock({ entities: entities.map(i => i.id === activeEntity.id ? { ...i, allowRotate: e.target.checked } : i) })}
                                        />
                                        Learner Can Rotate
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ZONE INSPECTOR */}
                    {activeZone && (
                        <div className="p-5 rounded-3xl bg-emerald-50/60 dark:bg-slate-950 border-2 border-emerald-200 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase tracking-widest text-emerald-700">Editing Zone: {activeZone.label}</span>
                                <button type="button" onClick={() => { updateBlock({ zones: zones.filter(z => z.id !== activeZone.id) }); setSelectedItem(null); }} className="text-rose-500 text-xs font-black flex items-center gap-1">
                                    <Trash2 size={13} /> Delete Zone
                                </button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                                <div className="col-span-2">
                                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Zone Label</label>
                                    <input type="text" value={activeZone.label} onChange={(e) => updateBlock({ zones: zones.map(z => z.id === activeZone.id ? { ...z, label: e.target.value } : z) })} className="w-full px-3 py-2 rounded-xl bg-white border text-xs font-black" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Capacity</label>
                                    <input type="number" min="1" max="12" value={activeZone.capacity ?? 1} onChange={(e) => updateBlock({ zones: zones.map(z => z.id === activeZone.id ? { ...z, capacity: parseInt(e.target.value) || 1 } : z) })} className="w-full px-3 py-2 rounded-xl bg-white border text-xs font-bold" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Category Filter</label>
                                    <input type="text" value={activeZone.acceptedCategory || ''} onChange={(e) => updateBlock({ zones: zones.map(z => z.id === activeZone.id ? { ...z, acceptedCategory: e.target.value || undefined } : z) })} placeholder="e.g., noun" className="w-full px-3 py-2 rounded-xl bg-white border text-xs font-bold" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Width ({activeZone.width}%)</label>
                                    <input type="range" min="10" max="75" value={activeZone.width} onChange={(e) => updateBlock({ zones: zones.map(z => z.id === activeZone.id ? { ...z, width: parseInt(e.target.value) } : z) })} className="w-full accent-emerald-600 mt-2" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Height ({activeZone.height}%)</label>
                                    <input type="range" min="10" max="75" value={activeZone.height} onChange={(e) => updateBlock({ zones: zones.map(z => z.id === activeZone.id ? { ...z, height: parseInt(e.target.value) } : z) })} className="w-full accent-emerald-600 mt-2" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: TIMELINE SCRUBBER BUILDER */}
            {activeTab === 'timeline' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-xs font-black text-indigo-600 cursor-pointer">
                            <input type="checkbox" checked={Boolean(block?.enableTimeline)} onChange={(e) => updateBlock({ enableTimeline: e.target.checked })} />
                            Enable Cause-and-Effect Timeline Scrubber on Student Canvas
                        </label>
                        <button
                            type="button"
                            onClick={() => updateBlock({
                                enableTimeline: true,
                                timelineKeyframes: [
                                    ...timelineKeyframes,
                                    { id: `kf_${Date.now()}`, progress: Math.min(100, timelineKeyframes.length * 50), title: `Stage ${timelineKeyframes.length + 1}`, description: 'Explain what happens at this point on the timeline...' }
                                ]
                            })}
                            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase"
                        >
                            + Add Keyframe
                        </button>
                    </div>
                    {timelineKeyframes.map((kf, kIdx) => (
                        <div key={kf.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border space-y-2">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black uppercase text-indigo-600">At {kf.progress}%</span>
                                <input type="range" min="0" max="100" value={kf.progress} onChange={(e) => { const u = [...timelineKeyframes]; u[kIdx] = { ...kf, progress: parseInt(e.target.value) }; updateBlock({ timelineKeyframes: u }); }} className="w-36 accent-indigo-600" />
                                <input type="text" value={kf.title} onChange={(e) => { const u = [...timelineKeyframes]; u[kIdx] = { ...kf, title: e.target.value }; updateBlock({ timelineKeyframes: u }); }} className="flex-1 px-3 py-1.5 rounded-xl bg-white border text-xs font-black" placeholder="Stage Title" />
                                <button type="button" onClick={() => updateBlock({ timelineKeyframes: timelineKeyframes.filter(i => i.id !== kf.id) })} className="text-rose-500"><Trash2 size={14} /></button>
                            </div>
                            <input type="text" value={kf.description} onChange={(e) => { const u = [...timelineKeyframes]; u[kIdx] = { ...kf, description: e.target.value }; updateBlock({ timelineKeyframes: u }); }} className="w-full px-3 py-1.5 rounded-xl bg-white border text-xs font-medium" placeholder="Cause-and-effect explanation..." />
                        </div>
                    ))}
                </div>
            )}

            {/* TAB 3: SLIDE LAYERS */}
            {activeTab === 'layers' && (
                <div className="space-y-4">
                    <button type="button" onClick={() => updateBlock({ layers: [...layers, { id: `layer_${Date.now()}`, name: `Layer ${layers.length + 1}`, theme: 'info', title: 'Layer Title', body: 'Layer feedback...', buttonLabel: 'Continue' }] })} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase">+ Add Slide Layer</button>
                    {layers.map((l, idx) => (
                        <div key={l.id} className="p-4 rounded-2xl bg-slate-50 border space-y-2">
                            <div className="flex items-center gap-2">
                                <input type="text" value={l.name} onChange={(e) => { const u = [...layers]; u[idx] = { ...l, name: e.target.value }; updateBlock({ layers: u }); }} className="px-3 py-1.5 rounded-xl bg-white border text-xs font-black" />
                                <input type="text" value={l.title} onChange={(e) => { const u = [...layers]; u[idx] = { ...l, title: e.target.value }; updateBlock({ layers: u }); }} className="flex-1 px-3 py-1.5 rounded-xl bg-white border text-xs font-bold" />
                                <button type="button" onClick={() => updateBlock({ layers: layers.filter(i => i.id !== l.id) })} className="text-rose-500"><Trash2 size={14} /></button>
                            </div>
                            <textarea value={l.body} onChange={(e) => { const u = [...layers]; u[idx] = { ...l, body: e.target.value }; updateBlock({ layers: u }); }} rows={2} className="w-full px-3 py-1.5 rounded-xl bg-white border text-xs" />
                        </div>
                    ))}
                </div>
            )}

            {/* ========================================================= */}
            {/* TAB 4: TRIGGERS & CASCADING MOTION PATH WIZARD            */}
            {/* ========================================================= */}
            {activeTab === 'rules' && (
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-bold text-slate-500">
                            Triggers automatically cascade: when Trigger 1 glides Object B into Destination Zone 2, any `on_drop` Trigger waiting for Object B in Zone 2 will fire automatically!
                        </p>
                        <button
                            type="button"
                            onClick={() =>
                                updateBlock({
                                    rules: [
                                        ...rules,
                                        {
                                            id: `r_${Date.now()}`,
                                            event: 'on_drop',
                                            entityId: entities[0]?.id || '',
                                            zoneId: zones[0]?.id || '',
                                            destinationZoneId: zones[1]?.id || zones[0]?.id || '',
                                            action: 'move_to_zone',
                                            targetEntityId: entities[1]?.id || entities[0]?.id || '',
                                            motionScale: 1,
                                            motionRotation: 0,
                                            motionDuration: 850,
                                            motionCurve: 'spring_bounce',
                                            reaction: 'bounce_glow',
                                            message: 'Chain reaction triggered!'
                                        }
                                    ]
                                })
                            }
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm"
                        >
                            <Plus size={12} /> Add Motion / Event Trigger
                        </button>
                    </div>

                    {rules.map((r, idx) => (
                        <div key={r.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">WHEN</span>
                                <select
                                    value={r.event || 'on_drop'}
                                    onChange={(e) => {
                                        const u = [...rules];
                                        u[idx] = { ...r, event: e.target.value as any };
                                        updateBlock({ rules: u });
                                    }}
                                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border text-xs font-black"
                                >
                                    <option value="on_drop">Object Enters / Dropped On Zone</option>
                                    <option value="on_click">User Clicks Object</option>
                                    <option value="on_connect">Connector Linked</option>
                                </select>

                                <select
                                    value={r.entityId}
                                    onChange={(e) => {
                                        const u = [...rules];
                                        u[idx] = { ...r, entityId: e.target.value };
                                        updateBlock({ rules: u });
                                    }}
                                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold"
                                >
                                    {entities.map(ent => <option key={ent.id} value={ent.id}>{ent.label}</option>)}
                                </select>

                                {(r.event || 'on_drop') === 'on_drop' && (
                                    <>
                                        <span className="text-[10px] font-black uppercase text-slate-400">IN ZONE:</span>
                                        <select
                                            value={r.zoneId}
                                            onChange={(e) => {
                                                const u = [...rules];
                                                u[idx] = { ...r, zoneId: e.target.value };
                                                updateBlock({ rules: u });
                                            }}
                                            className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold"
                                        >
                                            <option value="">(Any Zone)</option>
                                            {zones.map(z => <option key={z.id} value={z.id}>{z.label}</option>)}
                                        </select>
                                    </>
                                )}

                                <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">THEN</span>
                                <select
                                    value={r.action || 'reaction'}
                                    onChange={(e) => {
                                        const u = [...rules];
                                        u[idx] = { ...r, action: e.target.value as any };
                                        updateBlock({ rules: u });
                                    }}
                                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border text-xs font-black text-indigo-600"
                                >
                                    <option value="move_to_zone">🎯 Glide Object Into Zone / Bucket</option>
                                    <option value="animate_motion">🚀 Animate Object Along Path (X%, Y%)</option>
                                    <option value="change_state">🔄 Change State of Object</option>
                                    <option value="show_layer">📑 Pop Open Slide Layer</option>
                                    <option value="reaction">✨ Play Reaction & Banner</option>
                                    <option value="complete_block">🏁 Complete Interaction</option>
                                </select>

                                <button
                                    type="button"
                                    onClick={() => updateBlock({ rules: rules.filter(i => i.id !== r.id) })}
                                    className="ml-auto p-1.5 text-slate-400 hover:text-rose-500"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            {/* 🔥 SEPARATE destinationZoneId DROPDOWN SO IT NEVER OVERWRITES r.zoneId */}
                            {(r.action === 'animate_motion' || r.action === 'move_to_zone') && (
                                <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-slate-900 border border-indigo-200/70 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                                    <div>
                                        <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Object to Move</label>
                                        <select
                                            value={r.targetEntityId || r.entityId}
                                            onChange={(e) => {
                                                const u = [...rules];
                                                u[idx] = { ...r, targetEntityId: e.target.value };
                                                updateBlock({ rules: u });
                                            }}
                                            className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-950 border text-xs font-black"
                                        >
                                            {entities.map(ent => <option key={ent.id} value={ent.id}>{ent.label}</option>)}
                                        </select>
                                    </div>

                                    {r.action === 'move_to_zone' ? (
                                        <div>
                                            <label className="text-[9px] font-black uppercase text-emerald-600 block mb-1">Destination Zone</label>
                                            <select
                                                value={r.destinationZoneId || r.zoneId || ''}
                                                onChange={(e) => {
                                                    const u = [...rules];
                                                    u[idx] = { ...r, destinationZoneId: e.target.value };
                                                    updateBlock({ rules: u });
                                                }}
                                                className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-950 border border-emerald-300 text-xs font-black text-emerald-700"
                                            >
                                                {zones.map(z => <option key={z.id} value={z.id}>{z.label}</option>)}
                                            </select>
                                        </div>
                                    ) : (
                                        <>
                                            <div>
                                                <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">End X% ({r.motionX ?? 50}%)</label>
                                                <input
                                                    type="number"
                                                    min="5"
                                                    max="95"
                                                    value={r.motionX ?? 50}
                                                    onChange={(e) => {
                                                        const u = [...rules];
                                                        u[idx] = { ...r, motionX: parseInt(e.target.value) || 50 };
                                                        updateBlock({ rules: u });
                                                    }}
                                                    className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-950 border text-xs font-bold"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">End Y% ({r.motionY ?? 40}%)</label>
                                                <input
                                                    type="number"
                                                    min="5"
                                                    max="95"
                                                    value={r.motionY ?? 40}
                                                    onChange={(e) => {
                                                        const u = [...rules];
                                                        u[idx] = { ...r, motionY: parseInt(e.target.value) || 40 };
                                                        updateBlock({ rules: u });
                                                    }}
                                                    className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-950 border text-xs font-bold"
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div>
                                        <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">End Scale</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0.5"
                                            max="2.5"
                                            value={r.motionScale ?? 1}
                                            onChange={(e) => {
                                                const u = [...rules];
                                                u[idx] = { ...r, motionScale: parseFloat(e.target.value) || 1 };
                                                updateBlock({ rules: u });
                                            }}
                                            className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-950 border text-xs font-bold"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Duration (ms)</label>
                                        <input
                                            type="number"
                                            step="100"
                                            min="200"
                                            max="4000"
                                            value={r.motionDuration ?? 850}
                                            onChange={(e) => {
                                                const u = [...rules];
                                                u[idx] = { ...r, motionDuration: parseInt(e.target.value) || 850 };
                                                updateBlock({ rules: u });
                                            }}
                                            className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-950 border text-xs font-bold"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Easing Curve</label>
                                        <select
                                            value={r.motionCurve || 'spring_bounce'}
                                            onChange={(e) => {
                                                const u = [...rules];
                                                u[idx] = { ...r, motionCurve: e.target.value as any };
                                                updateBlock({ rules: u });
                                            }}
                                            className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-950 border text-xs font-bold"
                                        >
                                            <option value="spring_bounce">Spring Bounce</option>
                                            <option value="ease_in_out">Smooth Ease</option>
                                            <option value="linear">Linear Constant</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-2 pt-1">
                                <span className="text-[10px] font-black uppercase text-slate-400">Banner:</span>
                                <input
                                    type="text"
                                    value={r.message}
                                    onChange={(e) => {
                                        const u = [...rules];
                                        u[idx] = { ...r, message: e.target.value };
                                        updateBlock({ rules: u });
                                    }}
                                    placeholder="Feedback message when trigger fires..."
                                    className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* TAB 5: LIVE PLAY */}
            {activeTab === 'preview' && <KineticCanvasBlock block={{ ...block, entities, zones, rules, layers, timelineKeyframes }} />}
        </div>
    );
};
