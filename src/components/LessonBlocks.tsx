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
//  7. KINETIC CANVAS BLOCK (Storyline 360: States, Slide Layers, Mini-Quizzes & Triggers)
// ============================================================================
export type KineticObjectState = 'normal' | 'selected' | 'drop_correct' | 'drop_incorrect' | 'hidden' | 'disabled';

export interface KineticEntity {
    id: string;
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
}

export interface KineticSlideLayerOption {
    id: string;
    text: string;
}

export interface KineticSlideLayer {
    id: string;
    name: string; // Internal layer name for Trigger Wizard (e.g., "Layer 1: Vault Inspection")
    theme?: 'info' | 'success' | 'warning' | 'error' | 'quiz';
    title: string;
    body: string;
    imageUrl?: string;
    audioUrl?: string;
    buttonLabel?: string;
    // Optional embedded mini-quiz inside the Slide Layer
    hasQuiz?: boolean;
    quizQuestion?: string;
    quizOptions?: KineticSlideLayerOption[];
    correctOptionId?: string;
    gateUntilCorrect?: boolean;
    // Optional chained state change when the user closes this layer
    onCloseAction?: 'hide_layer' | 'change_state' | 'complete_block';
    onCloseTargetEntityId?: string;
    onCloseTargetState?: KineticObjectState;
}

export interface KineticRule {
    id: string;
    event?: 'on_drop' | 'on_click';
    entityId: string;
    zoneId: string;
    action?: 'reaction' | 'change_state' | 'show_layer' | 'hide_layer' | 'move_to_zone' | 'complete_block';
    targetEntityId?: string;
    targetState?: KineticObjectState;
    targetLayerId?: string; // Target Slide Layer to pop open
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

    const initialEntities: KineticEntity[] = useMemo(() => {
        if (Array.isArray(block?.entities)) {
            return JSON.parse(JSON.stringify(block.entities));
        }
        return [];
    }, [block?.entities]);

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

    const buildInitialStateMap = (ents: KineticEntity[]) => {
        const map: Record<string, KineticObjectState> = {};
        ents.forEach(e => {
            map[e.id] = e.initialState || 'normal';
        });
        return map;
    };

    const [entities, setEntities] = useState<KineticEntity[]>(initialEntities);
    const [objectStates, setObjectStates] = useState<Record<string, KineticObjectState>>(() => buildInitialStateMap(initialEntities));
    const [firedRuleIds, setFiredRuleIds] = useState<string[]>([]);
    const [completedLayerIds, setCompletedLayerIds] = useState<string[]>([]);
    const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
    const [layerQuizSelected, setLayerQuizSelected] = useState<string | null>(null);
    const [layerQuizSubmitted, setLayerQuizSubmitted] = useState(false);

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [snappedMap, setSnappedMap] = useState<Record<string, string>>({});
    const [activeReaction, setActiveReaction] = useState<string | null>(null);
    const [reactionBanner, setReactionBanner] = useState<string | null>(null);
    const [isVerified, setIsVerified] = useState(false);

    useEffect(() => {
        setEntities(initialEntities);
        setObjectStates(buildInitialStateMap(initialEntities));
    }, [initialEntities]);

    useEffect(() => {
        if (onStateChange) onStateChange({ entities, snappedMap, objectStates, activeLayerId, isVerified });
    }, [entities, snappedMap, objectStates, activeLayerId, isVerified, onStateChange]);

    const selectedEntity = entities.find(e => e.id === selectedId) || null;
    const activeLayer = layers.find(l => l.id === activeLayerId) || null;
    const bgThemeKey = block?.backgroundTheme || 'grid';
    const customBgUrl = block?.backgroundUrl || '';
    const isLightTheme = bgThemeKey === 'parchment' || bgThemeKey === 'blank' || bgThemeKey === 'light_grid';

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

        // If layer has a gated mini-quiz, verify answer first
        if (activeLayer.hasQuiz && (activeLayer.quizOptions?.length || 0) > 0) {
            if (!layerQuizSubmitted) {
                setLayerQuizSubmitted(true);
                const isCorrect = layerQuizSelected === activeLayer.correctOptionId;
                if (!isCorrect && activeLayer.gateUntilCorrect !== false) {
                    return; // Keep layer open so student can try again
                }
            } else {
                const isCorrect = layerQuizSelected === activeLayer.correctOptionId;
                if (!isCorrect && activeLayer.gateUntilCorrect !== false) {
                    setLayerQuizSubmitted(false);
                    setLayerQuizSelected(null);
                    return;
                }
            }
        }

        // Mark layer completed
        setCompletedLayerIds(prev => Array.from(new Set([...prev, activeLayer.id])));

        // Execute any chained onCloseAction configured on this Slide Layer
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

    const triggerCanvasReaction = (reactionType: string, message: string) => {
        if (reactionType) setActiveReaction(reactionType);
        if (message) setReactionBanner(message);
        setTimeout(() => setActiveReaction(null), 2200);
    };

    const executeTriggers = (matchingRules: KineticRule[], sourceEntityId: string) => {
        if (matchingRules.length === 0) return;

        const newlyFiredIds = matchingRules.map(r => r.id);
        setFiredRuleIds(prev => Array.from(new Set([...prev, ...newlyFiredIds])));

        matchingRules.forEach(rule => {
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
            } else if (actionType === 'move_to_zone' && rule.targetEntityId && rule.zoneId) {
                const destZone = zones.find(z => z.id === rule.zoneId);
                if (destZone) {
                    setEntities(prev => prev.map(ent =>
                        ent.id === rule.targetEntityId ? { ...ent, x: destZone.x, y: destZone.y } : ent
                    ));
                    setSnappedMap(prev => ({ ...prev, [rule.targetEntityId!]: destZone.id }));
                }
            } else if (actionType === 'complete_block') {
                setIsVerified(true);
                if (onComplete) setTimeout(() => onComplete(), 1200);
            }
        });
    };

    const handlePointerDown = (e: React.PointerEvent, entityId: string) => {
        if (isVerified || activeLayerId) return;
        const currentState = objectStates[entityId] || 'normal';
        if (currentState === 'disabled' || currentState === 'hidden') return;

        e.stopPropagation();
        setSelectedId(entityId);

        const ent = entities.find(item => item.id === entityId);

        const clickRules = rules.filter(r => r.event === 'on_click' && r.entityId === entityId);
        if (clickRules.length > 0) {
            executeTriggers(clickRules, entityId);
        } else if (ent?.draggable === false) {
            setObjectStates(prev => ({
                ...prev,
                [entityId]: prev[entityId] === 'selected' ? 'normal' : 'selected'
            }));
        }

        if (ent?.draggable !== false) {
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

            const dropRules = rules.filter(r => (r.event || 'on_drop') === 'on_drop' && r.entityId === entityId && r.zoneId === matchedZone!.id);
            if (dropRules.length > 0) {
                executeTriggers(dropRules, entityId);
            } else {
                const zoneHasOtherRules = rules.some(r => (r.event || 'on_drop') === 'on_drop' && r.zoneId === matchedZone!.id);
                if (zoneHasOtherRules) {
                    setObjectStates(prev => ({ ...prev, [entityId]: 'drop_incorrect' }));
                    triggerCanvasReaction('shake_error', 'Try a different placement!');
                }
            }
        } else {
            const nextSnapped = { ...snappedMap };
            delete nextSnapped[entityId];
            setSnappedMap(nextSnapped);
            setObjectStates(prev => ({ ...prev, [entityId]: 'normal' }));
        }
    };

    const updateEntityTransform = (id: string, field: 'scale' | 'rotation', value: number) => {
        if (isVerified) return;
        setEntities(prev => prev.map(ent => ent.id === id ? { ...ent, [field]: value } : ent));
    };

    const handleReset = () => {
        setEntities(JSON.parse(JSON.stringify(initialEntities)));
        setObjectStates(buildInitialStateMap(initialEntities));
        setFiredRuleIds([]);
        setCompletedLayerIds([]);
        setActiveLayerId(null);
        setLayerQuizSelected(null);
        setLayerQuizSubmitted(false);
        setSnappedMap({});
        setSelectedId(null);
        setActiveReaction(null);
        setReactionBanner(null);
        setIsVerified(false);
    };

    const ruleStatus = useMemo(() => {
        const requiredRules = rules.filter(r => r.isRequired !== false);
        if (requiredRules.length === 0) {
            const draggableEnts = entities.filter(e => e.draggable !== false);
            const placedCount = Object.keys(snappedMap).length;
            const total = Math.max(1, draggableEnts.length);
            return { completedCount: placedCount, total, allComplete: placedCount >= draggableEnts.length };
        }

        const results = requiredRules.map(rule => {
            if (rule.action === 'show_layer' && rule.targetLayerId) {
                return completedLayerIds.includes(rule.targetLayerId);
            }
            if (rule.event === 'on_click') {
                return firedRuleIds.includes(rule.id);
            }
            const isZoneMatched = snappedMap[rule.entityId] === rule.zoneId;
            const ent = entities.find(e => e.id === rule.entityId);
            const scaleOk = (ent?.allowResize && ent.targetScale) ? Math.abs(ent.scale - ent.targetScale) <= 0.25 : true;
            const rotateOk = (ent?.allowRotate && ent.targetRotation !== undefined) ? Math.abs(ent.rotation - ent.targetRotation) <= 15 : true;
            return isZoneMatched && scaleOk && rotateOk;
        });

        const completedCount = results.filter(Boolean).length;
        return { completedCount, total: requiredRules.length, allComplete: completedCount === requiredRules.length };
    }, [rules, snappedMap, entities, firedRuleIds, completedLayerIds]);

    const handleVerifyAndComplete = () => {
        if (ruleStatus.allComplete) {
            setIsVerified(true);
            triggerCanvasReaction(block?.successAnimation || 'chariot_march', 'All Canvas Objectives Verified!');
            if (onComplete) setTimeout(() => onComplete(), 1200);
        } else {
            setReactionBanner(`Keep going! ${ruleStatus.completedCount} of ${ruleStatus.total} interactions completed.`);
        }
    };

    const activeLayerStyle = LAYER_THEME_STYLES[activeLayer?.theme || (activeLayer?.hasQuiz ? 'quiz' : 'info')] || LAYER_THEME_STYLES.info;
    const isLayerQuizCorrect = activeLayer?.hasQuiz ? layerQuizSelected === activeLayer.correctOptionId : true;

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
                            {ruleStatus.completedCount} / {ruleStatus.total} Triggers Complete
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

            {/* Live Variable & State Telemetry */}
            {entities.length > 0 && (
                <div className="px-6 py-2.5 bg-slate-100/70 dark:bg-slate-950 border-b border-slate-200/70 dark:border-slate-800 flex items-center gap-2.5 overflow-x-auto custom-scrollbar">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 shrink-0 flex items-center gap-1">
                        <Zap size={12} className="text-amber-500" /> States:
                    </span>
                    {entities.map(ent => {
                        const st = objectStates[ent.id] || 'normal';
                        const matchedZone = zones.find(z => z.id === snappedMap[ent.id]);
                        return (
                            <div
                                key={ent.id}
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1.5 shrink-0 border ${
                                    st === 'drop_correct' || matchedZone
                                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                                        : st === 'drop_incorrect'
                                            ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 text-rose-600'
                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                                }`}
                            >
                                <span>{ent.variableName || ent.label}:</span>
                                <span className="text-indigo-600 dark:text-indigo-400 uppercase">
                                    {matchedZone ? matchedZone.label : st}
                                </span>
                                {ent.allowResize && <span className="opacity-70">({ent.scale.toFixed(1)}x)</span>}
                                {ent.allowRotate && <span className="opacity-70">({ent.rotation}°)</span>}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 2D Stage */}
            <div className="p-4 sm:p-6 bg-slate-100 dark:bg-slate-950">
                <div 
                    ref={canvasRef}
                    onPointerDown={() => setSelectedId(null)}
                    className={`relative w-full aspect-[16/10] min-h-[360px] rounded-[2rem] overflow-hidden border-2 border-slate-200 dark:border-slate-800 shadow-inner select-none touch-none ${KINETIC_BACKGROUNDS[bgThemeKey] || KINETIC_BACKGROUNDS.grid}`}
                    style={customBgUrl ? { backgroundImage: `url(${customBgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                >
                    {reactionBanner && !activeLayer && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-5 py-2.5 rounded-full bg-slate-900/95 text-white backdrop-blur-md shadow-xl border border-white/20 text-xs font-black flex items-center gap-2 animate-in slide-in-from-top-4">
                            <Sparkles size={14} className="text-amber-400 shrink-0" />
                            <span>{reactionBanner}</span>
                        </div>
                    )}

                    {activeReaction === 'chariot_march' && (
                        <div className="absolute inset-x-0 bottom-5 z-30 pointer-events-none flex items-center justify-center animate-in slide-in-from-left-full duration-700">
                            <div className="px-6 py-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest shadow-2xl flex items-center gap-2 border-2 border-amber-200">
                                <Flag size={16} /> Milestone Reaction Triggered!
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
                                className={`absolute rounded-3xl transition-all duration-300 flex flex-col items-center justify-center p-2 text-center pointer-events-none ${
                                    zone.invisible
                                        ? occupiedByEntityId ? 'border-2 border-emerald-400/60 bg-emerald-500/10' : 'border border-transparent'
                                        : isMatchedCorrectly
                                            ? 'border-2 border-dashed border-emerald-400 bg-emerald-500/15 scale-105'
                                            : occupiedByEntityId
                                                ? 'border-2 border-dashed border-indigo-400 bg-indigo-500/15'
                                                : isLightTheme
                                                    ? 'border-2 border-dashed border-slate-400/80 bg-white/60 text-slate-700 backdrop-blur-[2px]'
                                                    : 'border-2 border-dashed border-slate-600/80 bg-slate-800/40 text-slate-300 backdrop-blur-[2px]'
                                }`}
                            >
                                {!zone.invisible && (
                                    <>
                                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest opacity-90">{zone.label}</span>
                                        {zone.sublabel && <span className="text-[8px] font-bold opacity-60 mt-0.5">{zone.sublabel}</span>}
                                    </>
                                )}
                            </div>
                        );
                    })}

                    {/* Interactive Entities */}
                    {entities.map((ent) => {
                        const st = objectStates[ent.id] || 'normal';
                        if (st === 'hidden') return null;

                        const isSelected = selectedId === ent.id || st === 'selected';
                        const isDragging = draggingId === ent.id;
                        const isSnapped = Boolean(snappedMap[ent.id]);
                        const isDisabled = st === 'disabled';

                        let colorClasses = KINETIC_COLORS[ent.color || 'indigo'] || KINETIC_COLORS.indigo;
                        if (st === 'drop_correct') colorClasses = KINETIC_COLORS.emerald;
                        if (st === 'drop_incorrect') colorClasses = KINETIC_COLORS.rose;

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
                                    touchAction: 'none'
                                }}
                                className={`absolute z-20 transition-shadow select-none ${
                                    ent.imageUrl
                                        ? 'p-2 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-2 border-slate-200 dark:border-slate-700 shadow-xl'
                                        : `px-4 py-3 rounded-2xl border-2 shadow-xl ${colorClasses}`
                                } ${isDisabled ? 'opacity-45 grayscale cursor-not-allowed' : ent.draggable === false ? 'cursor-pointer hover:scale-105' : 'cursor-grab active:cursor-grabbing'} ${
                                    isDragging ? 'z-30 shadow-2xl ring-4 ring-white/50 scale-105' : ''
                                } ${isSelected ? 'ring-4 ring-indigo-400' : ''} ${
                                    activeReaction === 'bounce_glow' && isSnapped ? 'animate-bounce' : ''
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
                                        {ent.draggable !== false && <Move size={14} className="opacity-70 shrink-0" />}
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

                    {/* ========================================================= */}
                    {/* STORYLINE 360 SLIDE LAYER OVERLAY (Renders Over Canvas)   */}
                    {/* ========================================================= */}
                    {activeLayer && (
                        <div
                            onPointerDown={(e) => e.stopPropagation()}
                            className="absolute inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
                        >
                            <div className={`relative w-full max-w-lg max-h-[92%] overflow-y-auto custom-scrollbar bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-[2rem] border-2 ${activeLayerStyle.border} shadow-2xl p-6 sm:p-7 text-left animate-in zoom-in-95 duration-200`}>
                                {/* Top Gradient Accent */}
                                <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${activeLayerStyle.headerBg}`} />

                                <div className="flex items-center justify-between gap-3 mb-4">
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${activeLayerStyle.badge}`}>
                                        <Layers size={11} /> {activeLayer.name || 'Slide Layer'}
                                    </span>

                                    {(!activeLayer.hasQuiz || activeLayer.gateUntilCorrect === false) && (
                                        <button
                                            type="button"
                                            onClick={() => setActiveLayerId(null)}
                                            className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>

                                {activeLayer.imageUrl && (
                                    <div className="mb-4 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-40 bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
                                        <img src={activeLayer.imageUrl} alt={activeLayer.title} className="w-full h-full object-contain max-h-40" />
                                    </div>
                                )}

                                <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                                    {activeLayer.title}
                                </h4>

                                {activeLayer.body && (
                                    <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed mb-5 whitespace-pre-wrap">
                                        {activeLayer.body}
                                    </p>
                                )}

                                {/* EMBEDDED MINI-QUIZ INSIDE SLIDE LAYER */}
                                {activeLayer.hasQuiz && Array.isArray(activeLayer.quizOptions) && activeLayer.quizOptions.length > 0 && (
                                    <div className="mb-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                                            <HelpCircle size={13} /> Layer Checkpoint
                                        </div>
                                        {activeLayer.quizQuestion && (
                                            <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-white mb-2">
                                                {activeLayer.quizQuestion}
                                            </p>
                                        )}
                                        <div className="space-y-2">
                                            {activeLayer.quizOptions.map((opt) => {
                                                const isPicked = layerQuizSelected === opt.id;
                                                const isRight = opt.id === activeLayer.correctOptionId;
                                                let btnStyle = 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-400';

                                                if (layerQuizSubmitted) {
                                                    if (isRight) btnStyle = 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-500 text-emerald-800 dark:text-emerald-200';
                                                    else if (isPicked) btnStyle = 'bg-rose-50 dark:bg-rose-500/20 border-rose-500 text-rose-700 dark:text-rose-200';
                                                } else if (isPicked) {
                                                    btnStyle = 'bg-indigo-50 dark:bg-indigo-500/20 border-indigo-500 text-indigo-700 dark:text-indigo-200 ring-1 ring-indigo-500';
                                                }

                                                return (
                                                    <button
                                                        key={opt.id}
                                                        type="button"
                                                        disabled={layerQuizSubmitted && isLayerQuizCorrect}
                                                        onClick={() => {
                                                            setLayerQuizSelected(opt.id);
                                                            setLayerQuizSubmitted(false);
                                                        }}
                                                        className={`w-full p-3 rounded-xl border-2 text-left text-xs font-bold transition-all flex items-center justify-between gap-2 ${btnStyle}`}
                                                    >
                                                        <span>{opt.text}</span>
                                                        {layerQuizSubmitted && isRight && <Check size={15} className="text-emerald-500 shrink-0" />}
                                                        {layerQuizSubmitted && isPicked && !isRight && <X size={15} className="text-rose-500 shrink-0" />}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {layerQuizSubmitted && (
                                            <div className={`text-xs font-black pt-1 flex items-center gap-1.5 ${isLayerQuizCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                                                {isLayerQuizCorrect ? (
                                                    <><CheckCircle2 size={14} /> Correct! Click below to continue.</>
                                                ) : (
                                                    <><X size={14} /> Not quite right—select another option to unlock.</>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <button
                                    type="button"
                                    disabled={Boolean(activeLayer.hasQuiz && !layerQuizSelected)}
                                    onClick={handleCloseActiveLayer}
                                    className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 ${activeLayerStyle.btn}`}
                                >
                                    {activeLayer.hasQuiz && !layerQuizSubmitted ? (
                                        <>Check Answer <Check size={15} /></>
                                    ) : activeLayer.hasQuiz && layerQuizSubmitted && !isLayerQuizCorrect && activeLayer.gateUntilCorrect !== false ? (
                                        <>Try Again <RotateCcw size={14} /></>
                                    ) : (
                                        <>{activeLayer.buttonLabel || 'Continue'} <ArrowRight size={15} /></>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Transform Controls Dock */}
                {selectedEntity && !activeLayer && (selectedEntity.allowResize || selectedEntity.allowRotate) && (
                    <div className="mt-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-6">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                            Transform: {selectedEntity.label}
                        </span>
                        <div className="flex flex-wrap items-center gap-6 flex-1 justify-end">
                            {selectedEntity.allowResize && (
                                <div className="flex items-center gap-3 min-w-[170px]">
                                    <Maximize2 size={14} className="text-slate-400" />
                                    <input type="range" min="0.5" max="2.2" step="0.1" value={selectedEntity.scale} onChange={(e) => updateEntityTransform(selectedEntity.id, 'scale', parseFloat(e.target.value))} className="flex-1 accent-indigo-600 cursor-pointer" />
                                    <span className="text-xs font-black text-slate-700 dark:text-slate-200 tabular-nums w-9">{selectedEntity.scale.toFixed(1)}x</span>
                                </div>
                            )}
                            {selectedEntity.allowRotate && (
                                <div className="flex items-center gap-3 min-w-[170px]">
                                    <RotateCw size={14} className="text-slate-400" />
                                    <input type="range" min="-180" max="180" step="5" value={selectedEntity.rotation} onChange={(e) => updateEntityTransform(selectedEntity.id, 'rotation', parseInt(e.target.value))} className="flex-1 accent-indigo-600 cursor-pointer" />
                                    <span className="text-xs font-black text-slate-700 dark:text-slate-200 tabular-nums w-10">{selectedEntity.rotation}°</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                <span className="text-xs font-bold text-slate-500">
                    {ruleStatus.allComplete ? '✨ All spatial interactions & slide layers completed!' : 'Interact with the objects and drop zones on the canvas.'}
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
//  8. KINETIC CANVAS BUILDER (Storyline 360 Studio with Slide Layers Manager)
// ============================================================================
export const KineticCanvasBuilder = ({ block, onChange }: any) => {
    const [activeTab, setActiveTab] = useState<'canvas' | 'layers' | 'rules' | 'preview'>('canvas');
    const [selectedItem, setSelectedItem] = useState<{ type: 'entity' | 'zone', id: string } | null>(null);
    const [draggingTarget, setDraggingTarget] = useState<{ type: 'entity' | 'zone', id: string } | null>(null);
    const editorCanvasRef = useRef<HTMLDivElement>(null);
    const bgFileInputRef = useRef<HTMLInputElement>(null);
    const objFileInputRef = useRef<HTMLInputElement>(null);

    const entities: KineticEntity[] = Array.isArray(block?.entities) ? block.entities : [];
    const zones: KineticZone[] = Array.isArray(block?.zones) ? block.zones : [];
    const rules: KineticRule[] = Array.isArray(block?.rules) ? block.rules : [];
    const layers: KineticSlideLayer[] = Array.isArray(block?.layers) ? block.layers : [];

    const updateBlock = (patch: any) => {
        onChange({ ...block, type: 'kinetic_canvas', entities, zones, rules, layers, ...patch });
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

    const addNewEntity = (withImageUrl?: string) => {
        const newId = `ent_${Date.now()}`;
        const newEnt: KineticEntity = {
            id: newId,
            label: withImageUrl ? 'Sprite Object' : `Object ${entities.length + 1}`,
            sublabel: '',
            imageUrl: withImageUrl || '',
            color: 'indigo',
            x: 50,
            y: 78,
            scale: 1,
            rotation: 0,
            draggable: true,
            initialState: 'normal',
            allowResize: true,
            allowRotate: false,
            variableName: `Var_${entities.length + 1}`
        };
        updateBlock({ entities: [...entities, newEnt] });
        setSelectedItem({ type: 'entity', id: newId });
    };

    const addNewZone = (invisible = false) => {
        const newId = `zone_${Date.now()}`;
        const newZone: KineticZone = {
            id: newId,
            label: invisible ? `Hotspot ${zones.length + 1}` : `Drop Zone ${zones.length + 1}`,
            sublabel: '',
            x: 50,
            y: 35,
            width: 26,
            height: 24,
            invisible
        };
        updateBlock({ zones: [...zones, newZone] });
        setSelectedItem({ type: 'zone', id: newId });
    };

    const addNewSlideLayer = (withQuiz = false) => {
        const newId = `layer_${Date.now()}`;
        const newLayer: KineticSlideLayer = {
            id: newId,
            name: `Layer ${layers.length + 1}: ${withQuiz ? 'Mini-Quiz Gate' : 'Feedback Pop-Up'}`,
            theme: withQuiz ? 'quiz' : 'info',
            title: withQuiz ? 'Quick Knowledge Check' : 'Discovery Unlocked!',
            body: withQuiz
                ? 'Answer this question correctly to unlock the next stage on the base slide.'
                : 'Here is additional context and feedback triggered by your action on the canvas.',
            buttonLabel: 'Continue',
            hasQuiz: withQuiz,
            quizQuestion: withQuiz ? 'What does the idiom "break the ice" mean?' : '',
            quizOptions: withQuiz
                ? [
                      { id: 'opt_1', text: 'Make people feel more relaxed in a social situation' },
                      { id: 'opt_2', text: 'Cancel an event due to freezing weather' }
                  ]
                : [],
            correctOptionId: 'opt_1',
            gateUntilCorrect: true,
            onCloseAction: 'hide_layer',
            onCloseTargetEntityId: entities[0]?.id || '',
            onCloseTargetState: 'normal'
        };
        updateBlock({ layers: [...layers, newLayer] });
        setActiveTab('layers');
    };

    const clearToBlankCanvas = () => {
        updateBlock({
            title: block?.title || 'Interactive Slide Canvas',
            subtitle: 'Drag objects or click interactive elements on the slide.',
            backgroundTheme: 'light_grid',
            backgroundUrl: '',
            entities: [],
            zones: [],
            rules: [],
            layers: []
        });
        setSelectedItem(null);
    };

    const activeEntity = selectedItem?.type === 'entity' ? entities.find(e => e.id === selectedItem.id) : null;
    const activeZone = selectedItem?.type === 'zone' ? zones.find(z => z.id === selectedItem.id) : null;
    const bgThemeKey = block?.backgroundTheme || 'grid';

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-indigo-100 dark:border-slate-800 p-6 space-y-6 shadow-xl">
            {/* Hidden File Inputs */}
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
                    if (file) handleImageFileUpload(file, (dataUrl) => addNewEntity(dataUrl));
                }}
            />

            {/* TOP STUDIO BAR */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-full">
                        Storyline 360 Studio
                    </span>
                    <h4 className="text-lg font-black text-slate-800 dark:text-white mt-1">
                        Interactive States, Slide Layers & Triggers
                    </h4>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={clearToBlankCanvas}
                        className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                        Clear Slide
                    </button>

                    <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                        <button type="button" onClick={() => setActiveTab('canvas')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'canvas' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
                            1. Base Slide ({entities.length + zones.length})
                        </button>
                        <button type="button" onClick={() => setActiveTab('layers')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'layers' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
                            2. Slide Layers ({layers.length})
                        </button>
                        <button type="button" onClick={() => setActiveTab('rules')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'rules' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
                            3. Triggers ({rules.length})
                        </button>
                        <button type="button" onClick={() => setActiveTab('preview')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'preview' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'}`}>
                            4. Play Slide
                        </button>
                    </div>
                </div>
            </div>

            {/* SLIDE TITLE & BACKDROP CONFIG */}
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
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Canvas Theme</label>
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
                            placeholder="Paste image URL or click Upload ->"
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
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ========================================================= */}
            {/* TAB 1: BASE SLIDE STAGE & OBJECT INSPECTOR                */}
            {/* ========================================================= */}
            {activeTab === 'canvas' && (
                <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="text-xs font-bold text-slate-500">
                            Click any object or drop zone on the slide to edit its label, image, size, or initial state:
                        </span>
                        <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => addNewZone(false)} className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                                <Plus size={12} /> Drop Zone
                            </button>
                            <button type="button" onClick={() => addNewZone(true)} className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                                <Plus size={12} /> Hotspot
                            </button>
                            <button type="button" onClick={() => addNewEntity()} className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                                <Plus size={12} /> Text / Label Object
                            </button>
                            <button type="button" onClick={() => objFileInputRef.current?.click()} className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                                <Plus size={12} /> Import Image Object
                            </button>
                        </div>
                    </div>

                    {/* WYSIWYG AUTHORING STAGE */}
                    <div
                        ref={editorCanvasRef}
                        onPointerDown={() => setSelectedItem(null)}
                        onPointerMove={handleEditorPointerMove}
                        onPointerUp={handleEditorPointerUp}
                        className={`relative w-full aspect-[16/10] min-h-[340px] rounded-[2rem] border-2 border-slate-300 dark:border-slate-700 overflow-hidden select-none touch-none shadow-inner ${KINETIC_BACKGROUNDS[bgThemeKey] || KINETIC_BACKGROUNDS.grid}`}
                        style={block?.backgroundUrl ? { backgroundImage: `url(${block.backgroundUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                    >
                        {zones.map(z => {
                            const isSelected = selectedItem?.type === 'zone' && selectedItem.id === z.id;
                            return (
                                <div
                                    key={z.id}
                                    onPointerDown={(e) => handleEditorPointerDown(e, 'zone', z.id)}
                                    style={{ left: `${z.x}%`, top: `${z.y}%`, width: `${z.width}%`, height: `${z.height}%`, transform: 'translate(-50%, -50%)' }}
                                    className={`absolute rounded-3xl border-2 border-dashed flex flex-col items-center justify-center p-2 cursor-move transition-shadow ${
                                        z.invisible ? 'border-amber-400/90 bg-amber-500/15 text-amber-300' : 'border-emerald-400 bg-emerald-500/15 text-emerald-300'
                                    } ${isSelected ? 'ring-4 ring-indigo-500 z-30 bg-emerald-500/25' : 'z-10'}`}
                                >
                                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-black/50 text-white">
                                        {z.invisible ? `👁️ Hotspot: ${z.label}` : z.label}
                                    </span>
                                </div>
                            );
                        })}

                        {entities.map(ent => {
                            const isSelected = selectedItem?.type === 'entity' && selectedItem.id === ent.id;
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
                                            : `px-4 py-2.5 rounded-2xl border-2 shadow-xl ${colorClasses}`
                                    } ${isSelected ? 'ring-4 ring-amber-400 z-30' : ''} ${ent.initialState === 'hidden' ? 'opacity-50 border-dashed' : ''}`}
                                >
                                    {ent.imageUrl ? (
                                        <div className="flex flex-col items-center gap-1">
                                            <img src={ent.imageUrl} alt={ent.label} draggable={false} className="w-16 h-16 object-contain rounded-lg pointer-events-none" />
                                            <span className="text-[10px] font-black text-slate-800 dark:text-white">{ent.label}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                                            <Move size={12} />
                                            <div>
                                                <div className="text-xs font-black leading-none">{ent.label}</div>
                                                {ent.sublabel && <div className="text-[8px] font-bold opacity-80 mt-0.5">{ent.sublabel}</div>}
                                            </div>
                                        </div>
                                    )}
                                    {ent.initialState && ent.initialState !== 'normal' && (
                                        <span className="absolute -top-2.5 -right-2 px-1.5 py-0.5 rounded-full bg-slate-900 text-amber-300 text-[7px] font-black uppercase">
                                            {ent.initialState}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* SELECTED OBJECT INSPECTOR */}
                    {activeEntity && (
                        <div className="p-5 rounded-3xl bg-indigo-50/60 dark:bg-slate-950 border-2 border-indigo-200 dark:border-indigo-500/30 space-y-4">
                            <div className="flex items-center justify-between border-b border-indigo-100 dark:border-slate-800 pb-3">
                                <span className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                                    Editing Object: {activeEntity.label}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        updateBlock({ entities: entities.filter(e => e.id !== activeEntity.id) });
                                        setSelectedItem(null);
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-rose-100 text-rose-600 text-[10px] font-black uppercase flex items-center gap-1"
                                >
                                    <Trash2 size={12} /> Delete Object
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Primary Label</label>
                                    <input
                                        type="text"
                                        value={activeEntity.label}
                                        onChange={(e) => updateBlock({ entities: entities.map(item => item.id === activeEntity.id ? { ...item, label: e.target.value } : item) })}
                                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-black"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Subtitle / Note</label>
                                    <input
                                        type="text"
                                        value={activeEntity.sublabel || ''}
                                        onChange={(e) => updateBlock({ entities: entities.map(item => item.id === activeEntity.id ? { ...item, sublabel: e.target.value } : item) })}
                                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Initial State</label>
                                    <select
                                        value={activeEntity.initialState || 'normal'}
                                        onChange={(e) => updateBlock({ entities: entities.map(item => item.id === activeEntity.id ? { ...item, initialState: e.target.value as any } : item) })}
                                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold"
                                    >
                                        <option value="normal">Normal (Visible)</option>
                                        <option value="hidden">Hidden (Reveal via Trigger)</option>
                                        <option value="disabled">Disabled (Unlock via Trigger)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Color</label>
                                    <select
                                        value={activeEntity.color || 'indigo'}
                                        onChange={(e) => updateBlock({ entities: entities.map(item => item.id === activeEntity.id ? { ...item, color: e.target.value as any } : item) })}
                                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold"
                                    >
                                        <option value="indigo">Indigo</option>
                                        <option value="emerald">Emerald</option>
                                        <option value="amber">Amber</option>
                                        <option value="rose">Rose</option>
                                        <option value="cyan">Cyan</option>
                                        <option value="slate">Slate</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={activeEntity.draggable !== false}
                                        onChange={(e) => updateBlock({ entities: entities.map(item => item.id === activeEntity.id ? { ...item, draggable: e.target.checked } : item) })}
                                    />
                                    Draggable by Learner
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(activeEntity.allowResize)}
                                        onChange={(e) => updateBlock({ entities: entities.map(item => item.id === activeEntity.id ? { ...item, allowResize: e.target.checked } : item) })}
                                    />
                                    Learner Can Scale
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(activeEntity.allowRotate)}
                                        onChange={(e) => updateBlock({ entities: entities.map(item => item.id === activeEntity.id ? { ...item, allowRotate: e.target.checked } : item) })}
                                    />
                                    Learner Can Rotate
                                </label>
                            </div>
                        </div>
                    )}

                    {/* SELECTED ZONE INSPECTOR */}
                    {activeZone && (
                        <div className="p-5 rounded-3xl bg-emerald-50/60 dark:bg-slate-950 border-2 border-emerald-200 dark:border-emerald-500/30 space-y-4">
                            <div className="flex items-center justify-between border-b border-emerald-100 dark:border-slate-800 pb-3">
                                <span className="text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                                    Editing Zone: {activeZone.label}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        updateBlock({ zones: zones.filter(z => z.id !== activeZone.id) });
                                        setSelectedItem(null);
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-rose-100 text-rose-600 text-[10px] font-black uppercase flex items-center gap-1"
                                >
                                    <Trash2 size={12} /> Delete Zone
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Zone Label</label>
                                    <input
                                        type="text"
                                        value={activeZone.label}
                                        onChange={(e) => updateBlock({ zones: zones.map(z => z.id === activeZone.id ? { ...z, label: e.target.value } : z) })}
                                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-black"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Zone Sublabel</label>
                                    <input
                                        type="text"
                                        value={activeZone.sublabel || ''}
                                        onChange={(e) => updateBlock({ zones: zones.map(z => z.id === activeZone.id ? { ...z, sublabel: e.target.value } : z) })}
                                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Width ({activeZone.width}%)</label>
                                    <input type="range" min="10" max="60" value={activeZone.width} onChange={(e) => updateBlock({ zones: zones.map(z => z.id === activeZone.id ? { ...z, width: parseInt(e.target.value) } : z) })} className="w-full accent-emerald-600 mt-2" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Height ({activeZone.height}%)</label>
                                    <input type="range" min="10" max="60" value={activeZone.height} onChange={(e) => updateBlock({ zones: zones.map(z => z.id === activeZone.id ? { ...z, height: parseInt(e.target.value) } : z) })} className="w-full accent-emerald-600 mt-2" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ========================================================= */}
            {/* TAB 2: STORYLINE 360 SLIDE LAYERS AUTHORING               */}
            {/* ========================================================= */}
            {activeTab === 'layers' && (
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs font-bold text-slate-500">
                            Create pop-up Slide Layers (feedback cards or gated mini-quizzes) that can be launched by any Trigger:
                        </p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => addNewSlideLayer(false)}
                                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm"
                            >
                                <Plus size={12} /> Add Feedback Layer
                            </button>
                            <button
                                type="button"
                                onClick={() => addNewSlideLayer(true)}
                                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm"
                            >
                                <Plus size={12} /> Add Mini-Quiz Layer
                            </button>
                        </div>
                    </div>

                    {layers.length === 0 && (
                        <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs font-bold text-slate-400">
                            No Slide Layers yet. Add a Feedback Layer or Mini-Quiz Layer above, then link it in the Trigger Wizard.
                        </div>
                    )}

                    {layers.map((layer, lIdx) => (
                        <div key={layer.id} className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 dark:border-slate-800 pb-3">
                                <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                                    <Layers size={15} className="text-indigo-500 shrink-0" />
                                    <input
                                        type="text"
                                        value={layer.name}
                                        onChange={(e) => {
                                            const u = [...layers];
                                            u[lIdx] = { ...layer, name: e.target.value };
                                            updateBlock({ layers: u });
                                        }}
                                        placeholder="Internal Layer Name..."
                                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border text-xs font-black text-indigo-600 dark:text-indigo-400 flex-1"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <select
                                        value={layer.theme || 'info'}
                                        onChange={(e) => {
                                            const u = [...layers];
                                            u[lIdx] = { ...layer, theme: e.target.value as any };
                                            updateBlock({ layers: u });
                                        }}
                                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold"
                                    >
                                        <option value="info">Indigo Info Theme</option>
                                        <option value="success">Emerald Success Theme</option>
                                        <option value="warning">Amber Warning Theme</option>
                                        <option value="error">Rose Error Theme</option>
                                        <option value="quiz">Purple Quiz Theme</option>
                                    </select>

                                    <button
                                        type="button"
                                        onClick={() => updateBlock({ layers: layers.filter(item => item.id !== layer.id) })}
                                        className="p-2 text-slate-400 hover:text-rose-500"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="md:col-span-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Overlay Heading</label>
                                    <input
                                        type="text"
                                        value={layer.title}
                                        onChange={(e) => {
                                            const u = [...layers];
                                            u[lIdx] = { ...layer, title: e.target.value };
                                            updateBlock({ layers: u });
                                        }}
                                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-black"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Dismiss Button Label</label>
                                    <input
                                        type="text"
                                        value={layer.buttonLabel || 'Continue'}
                                        onChange={(e) => {
                                            const u = [...layers];
                                            u[lIdx] = { ...layer, buttonLabel: e.target.value };
                                            updateBlock({ layers: u });
                                        }}
                                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Overlay Narrative / Feedback Body</label>
                                <textarea
                                    value={layer.body}
                                    onChange={(e) => {
                                        const u = [...layers];
                                        u[lIdx] = { ...layer, body: e.target.value };
                                        updateBlock({ layers: u });
                                    }}
                                    rows={2}
                                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-medium resize-none"
                                />
                            </div>

                            {/* Optional Mini-Quiz Toggle & Editor */}
                            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <label className="flex items-center gap-2 text-xs font-black text-indigo-600 dark:text-indigo-400 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(layer.hasQuiz)}
                                            onChange={(e) => {
                                                const u = [...layers];
                                                u[lIdx] = {
                                                    ...layer,
                                                    hasQuiz: e.target.checked,
                                                    quizOptions: layer.quizOptions?.length ? layer.quizOptions : [
                                                        { id: 'opt_1', text: 'Correct Option' },
                                                        { id: 'opt_2', text: 'Distractor Option' }
                                                    ],
                                                    correctOptionId: layer.correctOptionId || 'opt_1'
                                                };
                                                updateBlock({ layers: u });
                                            }}
                                        />
                                        Embed Interactive Mini-Quiz on This Slide Layer
                                    </label>

                                    {/* Chained Action When Layer Closes */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">When Layer Closes:</span>
                                        <select
                                            value={layer.onCloseAction || 'hide_layer'}
                                            onChange={(e) => {
                                                const u = [...layers];
                                                u[lIdx] = { ...layer, onCloseAction: e.target.value as any };
                                                updateBlock({ layers: u });
                                            }}
                                            className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold"
                                        >
                                            <option value="hide_layer">Just Hide Layer</option>
                                            <option value="change_state">Unlock / Reveal Base Object</option>
                                            <option value="complete_block">Complete Entire Block</option>
                                        </select>

                                        {layer.onCloseAction === 'change_state' && (
                                            <>
                                                <select
                                                    value={layer.onCloseTargetEntityId || ''}
                                                    onChange={(e) => {
                                                        const u = [...layers];
                                                        u[lIdx] = { ...layer, onCloseTargetEntityId: e.target.value };
                                                        updateBlock({ layers: u });
                                                    }}
                                                    className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold"
                                                >
                                                    {entities.map(ent => <option key={ent.id} value={ent.id}>{ent.label}</option>)}
                                                </select>
                                                <select
                                                    value={layer.onCloseTargetState || 'normal'}
                                                    onChange={(e) => {
                                                        const u = [...layers];
                                                        u[lIdx] = { ...layer, onCloseTargetState: e.target.value as any };
                                                        updateBlock({ layers: u });
                                                    }}
                                                    className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold"
                                                >
                                                    <option value="normal">Normal (Reveal / Enable)</option>
                                                    <option value="drop_correct">Drop Correct</option>
                                                    <option value="hidden">Hidden</option>
                                                </select>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {layer.hasQuiz && (
                                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-slate-800 space-y-3">
                                        <input
                                            type="text"
                                            value={layer.quizQuestion || ''}
                                            onChange={(e) => {
                                                const u = [...layers];
                                                u[lIdx] = { ...layer, quizQuestion: e.target.value };
                                                updateBlock({ layers: u });
                                            }}
                                            placeholder="Mini-quiz question prompt..."
                                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-black"
                                        />
                                        <div className="space-y-2">
                                            {(layer.quizOptions || []).map((opt, oIdx) => (
                                                <div key={opt.id} className="flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        name={`correct_${layer.id}`}
                                                        checked={layer.correctOptionId === opt.id}
                                                        onChange={() => {
                                                            const u = [...layers];
                                                            u[lIdx] = { ...layer, correctOptionId: opt.id };
                                                            updateBlock({ layers: u });
                                                        }}
                                                    />
                                                    <input
                                                        type="text"
                                                        value={opt.text}
                                                        onChange={(e) => {
                                                            const nextOpts = [...(layer.quizOptions || [])];
                                                            nextOpts[oIdx] = { ...opt, text: e.target.value };
                                                            const u = [...layers];
                                                            u[lIdx] = { ...layer, quizOptions: nextOpts };
                                                            updateBlock({ layers: u });
                                                        }}
                                                        className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-bold"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ========================================================= */}
            {/* TAB 3: STORYLINE 360 TRIGGER WIZARD                       */}
            {/* ========================================================= */}
            {activeTab === 'rules' && (
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-bold text-slate-500">
                            Link events (`on_drop` or `on_click`) to Slide Layers, Object States, Motion Paths, or Reactions:
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
                                            action: layers.length > 0 ? 'show_layer' : 'reaction',
                                            targetLayerId: layers[0]?.id || '',
                                            targetEntityId: entities[0]?.id || '',
                                            targetState: 'normal',
                                            reaction: 'bounce_glow',
                                            message: 'Correct placement!'
                                        }
                                    ]
                                })
                            }
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm"
                        >
                            <Plus size={12} /> Add Storyline Trigger
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
                                    <option value="on_drop">Object Dropped On Zone</option>
                                    <option value="on_click">User Clicks Object</option>
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
                                        <span className="text-[10px] font-black uppercase text-slate-400">ON</span>
                                        <select
                                            value={r.zoneId}
                                            onChange={(e) => {
                                                const u = [...rules];
                                                u[idx] = { ...r, zoneId: e.target.value };
                                                updateBlock({ rules: u });
                                            }}
                                            className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold"
                                        >
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
                                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border text-xs font-black"
                                >
                                    <option value="show_layer">Pop Open Slide Layer</option>
                                    <option value="change_state">Change State of Object</option>
                                    <option value="reaction">Play Reaction & Banner</option>
                                    <option value="move_to_zone">Move Object to Zone</option>
                                    <option value="complete_block">Complete Interaction</option>
                                </select>

                                <button
                                    type="button"
                                    onClick={() => updateBlock({ rules: rules.filter(item => item.id !== r.id) })}
                                    className="ml-auto p-1.5 text-slate-400 hover:text-rose-500"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            {/* Action Target Row */}
                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                                {r.action === 'show_layer' && (
                                    <>
                                        <span className="text-[10px] font-black uppercase text-purple-600">Show Layer:</span>
                                        <select
                                            value={r.targetLayerId || layers[0]?.id || ''}
                                            onChange={(e) => {
                                                const u = [...rules];
                                                u[idx] = { ...r, targetLayerId: e.target.value };
                                                updateBlock({ rules: u });
                                            }}
                                            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border text-xs font-black text-purple-600"
                                        >
                                            {layers.length === 0 ? (
                                                <option value="">(Create a Slide Layer in Tab 2 first)</option>
                                            ) : (
                                                layers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)
                                            )}
                                        </select>
                                    </>
                                )}

                                {r.action === 'change_state' && (
                                    <>
                                        <span className="text-[10px] font-black uppercase text-slate-400">Set Object:</span>
                                        <select
                                            value={r.targetEntityId || r.entityId}
                                            onChange={(e) => {
                                                const u = [...rules];
                                                u[idx] = { ...r, targetEntityId: e.target.value };
                                                updateBlock({ rules: u });
                                            }}
                                            className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold"
                                        >
                                            {entities.map(ent => <option key={ent.id} value={ent.id}>{ent.label}</option>)}
                                        </select>
                                        <span className="text-[10px] font-black uppercase text-slate-400">To State:</span>
                                        <select
                                            value={r.targetState || 'normal'}
                                            onChange={(e) => {
                                                const u = [...rules];
                                                u[idx] = { ...r, targetState: e.target.value as any };
                                                updateBlock({ rules: u });
                                            }}
                                            className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold"
                                        >
                                            <option value="normal">Normal (Reveal / Enable)</option>
                                            <option value="drop_correct">Drop Correct (Emerald)</option>
                                            <option value="drop_incorrect">Drop Incorrect (Rose)</option>
                                            <option value="hidden">Hidden</option>
                                            <option value="disabled">Disabled</option>
                                        </select>
                                    </>
                                )}

                                <span className="text-[10px] font-black uppercase text-slate-400">Animation:</span>
                                <select
                                    value={r.reaction}
                                    onChange={(e) => {
                                        const u = [...rules];
                                        u[idx] = { ...r, reaction: e.target.value as any };
                                        updateBlock({ rules: u });
                                    }}
                                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold"
                                >
                                    <option value="bounce_glow">✨ Bounce & Glow</option>
                                    <option value="chariot_march">🏛️ Milestone Advance</option>
                                    <option value="lever_tilt">⚖️ Physics Spin</option>
                                    <option value="combine_flash">⚡ Combine Flash</option>
                                    <option value="shake_error">❌ Incorrect Shake</option>
                                </select>

                                <input
                                    type="text"
                                    value={r.message}
                                    onChange={(e) => {
                                        const u = [...rules];
                                        u[idx] = { ...r, message: e.target.value };
                                        updateBlock({ rules: u });
                                    }}
                                    placeholder="Feedback banner message..."
                                    className="flex-1 min-w-[160px] px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* TAB 4: INTERACTIVE SLIDE PREVIEW */}
            {activeTab === 'preview' && <KineticCanvasBlock block={{ ...block, entities, zones, rules, layers }} />}
        </div>
    );
};
