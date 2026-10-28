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

import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { CheckCircle2, Flag, Maximize2, Move, RotateCcw, RotateCw, Sparkles, Zap } from 'lucide-react';

// ============================================================================
//  KINETIC CANVAS BLOCK
//  Instructor-authored canvas: objects + triggers + actions.
//
//  Authoring data is plain JSON (see KineticBlockData). The engine below is
//  pure (no React), so it can be reused by an editor preview, unit tests, or a
//  server-side validator. Legacy blocks ({ entities, zones, rules[reaction] })
//  are migrated automatically by normalizeBlock().
// ============================================================================

// ─── 1. DATA MODEL ──────────────────────────────────────────────────────────

export type KineticColor = 'indigo' | 'emerald' | 'rose' | 'amber' | 'cyan';
export type AnimPreset = 'bounce' | 'shake' | 'pulse' | 'spin' | 'pop' | 'glow' | 'wobble';
export type EffectPreset = 'march' | 'flash' | 'tilt';
export type VarValue = number | string | boolean;

export interface Range { min: number; max: number; step?: number }
export interface Tolerance { value: number; tolerance: number }

export interface KineticObject {
    id: string;
    kind: 'token' | 'zone' | 'prop';
    label: string;
    sublabel?: string;
    emoji?: string;
    color?: KineticColor;
    tags?: string[];
    /** Centre position, % of the logical canvas. */
    x: number;
    y: number;
    /** Size in % of the canvas (zones). */
    w?: number;
    h?: number;
    scale?: number;
    rotation?: number;
    visible?: boolean;

    // token
    resize?: Range;
    rotate?: Range;
    /** Correct answer: zone id plus optional transform targets. */
    target?: { zone: string; scale?: Tolerance; rotation?: Tolerance };
    /** 'return' sends a wrong drop back home (immediate feedback); 'stay' snaps anyway (check on verify). */
    onWrong?: 'return' | 'stay';
    lockOnCorrect?: boolean;
    /** false = decoy; ignored by completion. */
    required?: boolean;
    variableName?: string;

    // zone
    /** Category sorting: tags this zone accepts (used when a token has no explicit target). */
    accepts?: string[];
    capacity?: number;
}

/** Reference to objects: an id, '#tag', or (in actions) '$self' / '$zone'. */
export type Ref = string;

export interface Condition {
    var: string;
    op: '==' | '!=' | '>=' | '<=' | '>' | '<';
    value: VarValue;
}

export type Trigger =
    | { type: 'dragStart'; object?: Ref }
    | { type: 'drop'; object?: Ref; zone?: Ref; correct?: boolean }
    | { type: 'reject'; object?: Ref; zone?: Ref }
    | { type: 'release'; object?: Ref }
    | { type: 'tap'; object?: Ref }
    | { type: 'transform'; object?: Ref; prop: 'scale' | 'rotation'; min?: number; max?: number }
    | { type: 'complete' };

export type RuleAction =
    | { type: 'animate'; target: Ref; preset: AnimPreset }
    | { type: 'effect'; preset: EffectPreset }
    | { type: 'banner'; message: string }
    | { type: 'show' | 'hide'; target: Ref }
    | { type: 'move'; target: Ref; x: number; y: number }
    | { type: 'setTransform'; target: Ref; scale?: number; rotation?: number }
    | { type: 'setVar'; name: string; op?: 'set' | 'add'; value: VarValue }
    | { type: 'sound'; src: string };

export interface KineticRule {
    id: string;
    when: Trigger;
    if?: Condition[];
    then: RuleAction[];
    once?: boolean;
}

export interface KineticBlockData {
    title?: string;
    backgroundTheme?: string;
    canvas?: { width: number; height: number };
    /** 'verify' shows a Verify button, 'auto' completes as soon as everything is solved. */
    completion?: 'verify' | 'auto';
    objects: KineticObject[];
    variables?: { name: string; label?: string; initial: VarValue }[];
    rules: KineticRule[];
}

// ─── 2. RUNTIME STATE ───────────────────────────────────────────────────────

interface RuntimeObject { x: number; y: number; scale: number; rotation: number; visible: boolean }

export interface KineticState {
    objs: Record<string, RuntimeObject>;
    placed: Record<string, string>; // tokenId -> zoneId
    locked: Record<string, true>;
    vars: Record<string, VarValue>;
    fired: Record<string, true>;
    attempts: number;
    verified: boolean;
    // transient presentation state (not persisted)
    anims: Record<string, { preset: AnimPreset; n: number }>;
    effect: { preset: EffectPreset; n: number } | null;
    banner: { message: string; n: number } | null;
    sound: { src: string; n: number } | null;
    fx: number;
}

export type KineticSnapshot = Pick<
    KineticState,
    'objs' | 'placed' | 'locked' | 'vars' | 'fired' | 'attempts' | 'verified'
>;

export interface KineticResult {
    solved: number;
    total: number;
    score: number;
    attempts: number;
    vars: Record<string, VarValue>;
}

type KineticEvent =
    | { type: 'dragStart'; object: string }
    | { type: 'drop'; object: string; zone: string; correct: boolean }
    | { type: 'reject'; object: string; zone: string }
    | { type: 'release'; object: string }
    | { type: 'tap'; object: string }
    | { type: 'transform'; object: string; prop: 'scale' | 'rotation'; value: number }
    | { type: 'complete' };

type Msg =
    | { type: 'dragStart'; id: string }
    | { type: 'drop'; id: string; x: number; y: number; zoneId: string | null }
    | { type: 'tap'; id: string }
    | { type: 'transform'; id: string; prop: 'scale' | 'rotation'; value: number }
    | { type: 'verify' }
    | { type: 'reset' };

// ─── 3. ENGINE (pure) ───────────────────────────────────────────────────────

type ById = Record<string, KineticObject>;
interface Ctx { self?: string; zone?: string }

const indexById = (objects: KineticObject[]): ById =>
    objects.reduce<ById>((acc, o) => { acc[o.id] = o; return acc; }, {});

const without = <T,>(rec: Record<string, T>, key: string): Record<string, T> => {
    const next = { ...rec };
    delete next[key];
    return next;
};

const matchRef = (ref: Ref | undefined, id: string | undefined, byId: ById): boolean => {
    if (ref === undefined) return true;
    if (id === undefined) return false;
    if (ref.startsWith('#')) return !!byId[id]?.tags?.includes(ref.slice(1));
    return ref === id;
};

const resolveTargets = (ref: Ref, ctx: Ctx, objects: KineticObject[]): string[] => {
    if (ref === '$self') return ctx.self ? [ctx.self] : [];
    if (ref === '$zone') return ctx.zone ? [ctx.zone] : [];
    if (ref.startsWith('#')) return objects.filter(o => o.tags?.includes(ref.slice(1))).map(o => o.id);
    return objects.some(o => o.id === ref) ? [ref] : [];
};

const evalCondition = (c: Condition, vars: Record<string, VarValue>): boolean => {
    const v = vars[c.var];
    switch (c.op) {
        case '==': return v === c.value;
        case '!=': return v !== c.value;
        case '>=': return Number(v) >= Number(c.value);
        case '<=': return Number(v) <= Number(c.value);
        case '>': return Number(v) > Number(c.value);
        case '<': return Number(v) < Number(c.value);
    }
};

const ruleMatches = (rule: KineticRule, ev: KineticEvent, byId: ById): boolean => {
    const t = rule.when;
    if (t.type !== ev.type) return false;
    if (t.type === 'complete' || ev.type === 'complete') return true;
    if (!matchRef(t.object, ev.object, byId)) return false;
    if (t.type === 'drop' && ev.type === 'drop') {
        if (!matchRef(t.zone, ev.zone, byId)) return false;
        if (t.correct !== undefined && t.correct !== ev.correct) return false;
    }
    if (t.type === 'reject' && ev.type === 'reject' && !matchRef(t.zone, ev.zone, byId)) return false;
    if (t.type === 'transform' && ev.type === 'transform') {
        if (t.prop !== ev.prop) return false;
        if (t.min !== undefined && ev.value < t.min) return false;
        if (t.max !== undefined && ev.value > t.max) return false;
    }
    return true;
};

/** Mutates `s` (which must already be a fresh shallow copy). */
const applyAction = (s: KineticState, a: RuleAction, ctx: Ctx, objects: KineticObject[]): void => {
    switch (a.type) {
        case 'animate':
            resolveTargets(a.target, ctx, objects).forEach(id => { s.anims[id] = { preset: a.preset, n: ++s.fx }; });
            break;
        case 'effect':
            s.effect = { preset: a.preset, n: ++s.fx };
            break;
        case 'banner':
            s.banner = { message: a.message, n: ++s.fx };
            break;
        case 'show':
        case 'hide':
            resolveTargets(a.target, ctx, objects).forEach(id => {
                if (s.objs[id]) s.objs[id] = { ...s.objs[id], visible: a.type === 'show' };
            });
            break;
        case 'move':
            resolveTargets(a.target, ctx, objects).forEach(id => {
                if (!s.objs[id]) return;
                s.objs[id] = { ...s.objs[id], x: a.x, y: a.y };
                s.placed = without(s.placed, id);
            });
            break;
        case 'setTransform':
            resolveTargets(a.target, ctx, objects).forEach(id => {
                if (!s.objs[id]) return;
                s.objs[id] = {
                    ...s.objs[id],
                    scale: a.scale ?? s.objs[id].scale,
                    rotation: a.rotation ?? s.objs[id].rotation,
                };
            });
            break;
        case 'setVar': {
            const cur = s.vars[a.name];
            s.vars[a.name] = a.op === 'add' ? Number(cur ?? 0) + Number(a.value) : a.value;
            break;
        }
        case 'sound':
            s.sound = { src: a.src, n: ++s.fx };
            break;
    }
};

const runEvent = (state: KineticState, ev: KineticEvent, data: KineticBlockData, byId: ById): KineticState => {
    const s: KineticState = {
        ...state,
        objs: { ...state.objs },
        placed: { ...state.placed },
        vars: { ...state.vars },
        fired: { ...state.fired },
        anims: { ...state.anims },
    };
    const ctx: Ctx = ev.type === 'complete' ? {} : { self: ev.object, zone: 'zone' in ev ? ev.zone : undefined };

    // Rules run in order against the progressively updated state, so a later
    // rule can react to variables an earlier rule just changed.
    for (const rule of data.rules) {
        if (rule.once && s.fired[rule.id]) continue;
        if (!ruleMatches(rule, ev, byId)) continue;
        if (rule.if && !rule.if.every(c => evalCondition(c, s.vars))) continue;
        if (rule.once) s.fired[rule.id] = true;
        rule.then.forEach(a => applyAction(s, a, ctx, data.objects));
    }
    return s;
};

const checkTolerance = (v: number, t?: Tolerance) => !t || Math.abs(v - t.value) <= t.tolerance;

export const isCorrectPlacement = (tok: KineticObject, zone: KineticObject): boolean => {
    if (tok.target) return tok.target.zone === zone.id;
    if (zone.accepts) return zone.accepts.some(tag => tok.tags?.includes(tag));
    return true;
};

const computeProgress = (data: KineticBlockData, s: KineticState, byId: ById) => {
    const required = data.objects.filter(o => o.kind === 'token' && o.required !== false);
    const solved = required.filter(tok => {
        const zone = s.placed[tok.id] ? byId[s.placed[tok.id]] : undefined;
        const rt = s.objs[tok.id];
        return !!zone && !!rt
            && isCorrectPlacement(tok, zone)
            && checkTolerance(rt.scale, tok.target?.scale)
            && checkTolerance(rt.rotation, tok.target?.rotation);
    }).length;
    return { solved, total: required.length, allSolved: required.length > 0 && solved === required.length };
};

/** Lays out every token in a zone (centred; spread horizontally if capacity > 1). */
const relayout = (objs: Record<string, RuntimeObject>, placed: Record<string, string>, zoneId: string | undefined, byId: ById) => {
    if (!zoneId || !byId[zoneId] || !objs[zoneId]) return;
    const ids = Object.keys(placed).filter(id => placed[id] === zoneId);
    const n = ids.length;
    const gap = Math.min(12, (byId[zoneId].w ?? 20) / Math.max(n, 1));
    ids.forEach((id, i) => {
        objs[id] = { ...objs[id], x: objs[zoneId].x + (n > 1 ? (i - (n - 1) / 2) * gap : 0), y: objs[zoneId].y };
    });
};

export const createInitialState = (data: KineticBlockData, saved?: Partial<KineticSnapshot>): KineticState => {
    const objs: Record<string, RuntimeObject> = {};
    data.objects.forEach(o => {
        objs[o.id] = { x: o.x, y: o.y, scale: o.scale ?? 1, rotation: o.rotation ?? 0, visible: o.visible !== false };
    });
    const vars: Record<string, VarValue> = {};
    data.variables?.forEach(v => { vars[v.name] = v.initial; });

    return {
        objs: { ...objs, ...(saved?.objs ?? {}) },
        placed: saved?.placed ?? {},
        locked: saved?.locked ?? {},
        vars: { ...vars, ...(saved?.vars ?? {}) },
        fired: saved?.fired ?? {},
        attempts: saved?.attempts ?? 0,
        verified: saved?.verified ?? false,
        anims: {}, effect: null, banner: null, sound: null, fx: 0,
    };
};

const createReducer = (data: KineticBlockData) => {
    const byId = indexById(data.objects);

    return (state: KineticState, msg: Msg): KineticState => {
        switch (msg.type) {
            case 'reset':
                return createInitialState(data);

            case 'dragStart': {
                if (state.verified || state.locked[msg.id]) return state;
                return runEvent(state, { type: 'dragStart', object: msg.id }, data, byId);
            }

            case 'tap':
                return runEvent(state, { type: 'tap', object: msg.id }, data, byId);

            case 'transform': {
                if (state.verified || state.locked[msg.id] || !state.objs[msg.id]) return state;
                const next = { ...state, objs: { ...state.objs, [msg.id]: { ...state.objs[msg.id], [msg.prop]: msg.value } } };
                return runEvent(next, { type: 'transform', object: msg.id, prop: msg.prop, value: msg.value }, data, byId);
            }

            case 'drop': {
                const tok = byId[msg.id];
                if (!tok || state.verified || state.locked[msg.id]) return state;
                const prevZone = state.placed[tok.id];
                const zone = msg.zoneId ? byId[msg.zoneId] : undefined;
                const placedWithout = without(state.placed, tok.id);

                if (!zone) {
                    // Released in open space.
                    const objs = { ...state.objs, [tok.id]: { ...state.objs[tok.id], x: msg.x, y: msg.y } };
                    relayout(objs, placedWithout, prevZone, byId);
                    return runEvent({ ...state, objs, placed: placedWithout }, { type: 'release', object: tok.id }, data, byId);
                }

                const correct = isCorrectPlacement(tok, zone);
                const occupied = Object.keys(placedWithout).filter(id => placedWithout[id] === zone.id).length;
                const full = occupied >= (zone.capacity ?? 1);

                if (full || (!correct && (tok.onWrong ?? 'return') === 'return')) {
                    const objs = { ...state.objs, [tok.id]: { ...state.objs[tok.id], x: tok.x, y: tok.y } };
                    relayout(objs, placedWithout, prevZone, byId);
                    return runEvent(
                        { ...state, objs, placed: placedWithout, attempts: state.attempts + 1 },
                        { type: 'reject', object: tok.id, zone: zone.id }, data, byId,
                    );
                }

                const placed = { ...placedWithout, [tok.id]: zone.id };
                const objs = { ...state.objs };
                relayout(objs, placed, zone.id, byId);
                if (prevZone && prevZone !== zone.id) relayout(objs, placed, prevZone, byId);
                const locked = correct && tok.lockOnCorrect ? { ...state.locked, [tok.id]: true as const } : state.locked;
                return runEvent({ ...state, objs, placed, locked }, { type: 'drop', object: tok.id, zone: zone.id, correct }, data, byId);
            }

            case 'verify': {
                if (state.verified) return state;
                const { solved, total, allSolved } = computeProgress(data, state, byId);
                if (!allSolved) {
                    const n = state.fx + 1;
                    return { ...state, fx: n, banner: { message: `Keep going! ${solved} of ${total} interactions aligned.`, n } };
                }
                const done = runEvent({ ...state, verified: true }, { type: 'complete' }, data, byId);
                if (!data.rules.some(r => r.when.type === 'complete')) {
                    done.banner = { message: 'All canvas objectives verified!', n: ++done.fx };
                }
                return done;
            }
        }
    };
};

// ─── 4. BLOCK NORMALISATION (+ legacy migration) ────────────────────────────

const DEFAULT_BLOCK: KineticBlockData = {
    title: 'Build the Sentence: Marcus Carries the Sword',
    backgroundTheme: 'roman_road',
    canvas: { width: 800, height: 500 },
    completion: 'verify',
    variables: [{ name: 'locked', label: 'Words locked', initial: 0 }],
    objects: [
        { id: 'zone_1', kind: 'zone', label: '1. Agent (Nominative)', x: 22, y: 32, w: 26, h: 24 },
        { id: 'zone_2', kind: 'zone', label: '2. Target (Accusative)', x: 50, y: 32, w: 26, h: 24 },
        { id: 'zone_3', kind: 'zone', label: '3. Action (Verb)', x: 78, y: 32, w: 26, h: 24 },
        { id: 'ent_1', kind: 'token', label: 'Marcus', sublabel: 'Nominative (Subj)', color: 'indigo', x: 20, y: 78, variableName: 'Subject', target: { zone: 'zone_1' }, lockOnCorrect: true },
        { id: 'ent_2', kind: 'token', label: 'gladium', sublabel: 'Accusative (Obj)', color: 'amber', x: 50, y: 78, variableName: 'Direct Object', resize: { min: 0.6, max: 1.8, step: 0.1 }, target: { zone: 'zone_2' }, lockOnCorrect: true },
        { id: 'ent_3', kind: 'token', label: 'portat', sublabel: '3rd Sing. Verb', color: 'emerald', x: 80, y: 78, variableName: 'Action Verb', target: { zone: 'zone_3' }, lockOnCorrect: true },
        { id: 'legion', kind: 'prop', label: 'Legion', emoji: '🛡️', x: 91, y: 11, tags: ['legion'] },
    ],
    rules: [
        { id: 'r1', when: { type: 'drop', object: 'ent_1', correct: true }, then: [
            { type: 'animate', target: '$self', preset: 'bounce' }, { type: 'animate', target: '$self', preset: 'glow' },
            { type: 'setVar', name: 'locked', op: 'add', value: 1 }, { type: 'banner', message: 'Subject locked: Marcus!' } ] },
        { id: 'r2', when: { type: 'drop', object: 'ent_2', correct: true }, then: [
            { type: 'effect', preset: 'flash' }, { type: 'animate', target: '$zone', preset: 'pulse' },
            { type: 'setVar', name: 'locked', op: 'add', value: 1 }, { type: 'banner', message: 'Accusative object linked!' } ] },
        { id: 'r3', when: { type: 'drop', object: 'ent_3', correct: true }, then: [
            { type: 'animate', target: '$self', preset: 'pop' },
            { type: 'setVar', name: 'locked', op: 'add', value: 1 }, { type: 'banner', message: 'Verb locked: portat!' } ] },
        // Runs after r1–r3 in the same event, so it sees the updated counter.
        { id: 'r4', when: { type: 'drop', correct: true }, if: [{ var: 'locked', op: '>=', value: 3 }], then: [
            { type: 'effect', preset: 'march' }, { type: 'animate', target: '#legion', preset: 'bounce' },
            { type: 'banner', message: 'Syntax complete! The legion advances!' } ] },
        { id: 'r5', when: { type: 'reject' }, then: [
            { type: 'animate', target: '$self', preset: 'shake' }, { type: 'banner', message: 'Not quite. Check the case ending.' } ] },
        { id: 'r6', when: { type: 'tap', object: '#legion' }, then: [
            { type: 'animate', target: '$self', preset: 'wobble' }, { type: 'banner', message: 'The legion awaits your orders.' } ] },
        { id: 'r7', once: true, when: { type: 'transform', object: 'ent_2', prop: 'scale', min: 1.5 }, then: [
            { type: 'banner', message: 'A mighty gladius!' } ] },
        { id: 'r8', when: { type: 'complete' }, then: [
            { type: 'effect', preset: 'march' }, { type: 'animate', target: '#legion', preset: 'pop' },
            { type: 'banner', message: 'All canvas objectives verified!' } ] },
    ],
};

interface LegacyEntity {
    id: string; label: string; sublabel?: string; color?: KineticColor; x: number; y: number;
    scale?: number; rotation?: number; allowResize?: boolean; allowRotate?: boolean;
    targetScale?: number; targetRotation?: number; variableName?: string;
}
interface LegacyZone { id: string; label: string; x: number; y: number; width: number; height: number }
interface LegacyRule { id: string; entityId: string; zoneId: string; reaction: string; message: string }

const legacyReaction = (reaction: string, message: string): RuleAction[] => {
    const banner: RuleAction = { type: 'banner', message };
    switch (reaction) {
        case 'bounce_glow': return [{ type: 'animate', target: '$self', preset: 'bounce' }, { type: 'animate', target: '$self', preset: 'glow' }, banner];
        case 'chariot_march': return [{ type: 'effect', preset: 'march' }, banner];
        case 'lever_tilt': return [{ type: 'effect', preset: 'tilt' }, banner];
        default: return [{ type: 'effect', preset: 'flash' }, banner];
    }
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export const normalizeBlock = (block: any): KineticBlockData => {
    if (Array.isArray(block?.objects) && block.objects.length > 0) {
        return { ...block, objects: block.objects, rules: Array.isArray(block.rules) ? block.rules : [] };
    }
    if (Array.isArray(block?.entities) && block.entities.length > 0) {
        const entities: LegacyEntity[] = block.entities;
        const zones: LegacyZone[] = Array.isArray(block.zones) ? block.zones : [];
        const legacyRules: LegacyRule[] = Array.isArray(block.rules) ? block.rules : [];

        const objects: KineticObject[] = [
            ...zones.map((z): KineticObject => ({ id: z.id, kind: 'zone', label: z.label, x: z.x, y: z.y, w: z.width, h: z.height })),
            ...entities.map((e): KineticObject => {
                const r = legacyRules.find(lr => lr.entityId === e.id);
                return {
                    id: e.id, kind: 'token', label: e.label, sublabel: e.sublabel, color: e.color,
                    x: e.x, y: e.y, scale: e.scale, rotation: e.rotation, variableName: e.variableName,
                    resize: e.allowResize ? { min: 0.6, max: 1.8, step: 0.1 } : undefined,
                    rotate: e.allowRotate ? { min: -90, max: 90, step: 5 } : undefined,
                    // Legacy behaviour: snap anywhere, check everything on Verify.
                    onWrong: 'stay',
                    target: r ? {
                        zone: r.zoneId,
                        scale: e.allowResize && e.targetScale ? { value: e.targetScale, tolerance: 0.25 } : undefined,
                        rotation: e.allowRotate && e.targetRotation !== undefined ? { value: e.targetRotation, tolerance: 15 } : undefined,
                    } : undefined,
                };
            }),
        ];
        const rules: KineticRule[] = [
            ...legacyRules.map((r): KineticRule => ({
                id: r.id, when: { type: 'drop', object: r.entityId, zone: r.zoneId }, then: legacyReaction(r.reaction, r.message),
            })),
            { id: 'legacy_complete', when: { type: 'complete' }, then: legacyReaction(block.successAnimation || 'chariot_march', 'All Canvas Objectives Verified!') },
        ];
        return { title: block.title, backgroundTheme: block.backgroundTheme, objects, rules, completion: 'verify' };
    }
    return { ...DEFAULT_BLOCK, title: block?.title ?? DEFAULT_BLOCK.title };
};
/* eslint-enable @typescript-eslint/no-explicit-any */

// ─── 5. PRESENTATION ────────────────────────────────────────────────────────

const KINETIC_COLORS: Record<string, string> = {
    indigo: 'bg-indigo-600 text-white border-indigo-400 shadow-indigo-500/30',
    emerald: 'bg-emerald-600 text-white border-emerald-400 shadow-emerald-500/30',
    rose: 'bg-rose-600 text-white border-rose-400 shadow-rose-500/30',
    amber: 'bg-amber-500 text-slate-950 border-amber-300 shadow-amber-500/30',
    cyan: 'bg-cyan-600 text-white border-cyan-400 shadow-cyan-500/30',
};

const KINETIC_BACKGROUNDS: Record<string, string> = {
    grid: 'bg-slate-900 bg-[radial-gradient(#334155_1.5px,transparent_1.5px)] [background-size:24px_24px]',
    roman_road: 'bg-gradient-to-b from-amber-950 via-stone-900 to-slate-950',
    physics_lab: 'bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900',
    parchment: 'bg-gradient-to-br from-amber-50 via-orange-50/80 to-amber-100 text-slate-900',
};

const ANIMATIONS: Record<AnimPreset, { keyframes: Keyframe[]; options: KeyframeAnimationOptions }> = {
    bounce: {
        keyframes: [
            { transform: 'translateY(0)' }, { transform: 'translateY(-22px)', offset: 0.3 },
            { transform: 'translateY(0)', offset: 0.55 }, { transform: 'translateY(-9px)', offset: 0.75 }, { transform: 'translateY(0)' },
        ],
        options: { duration: 720, easing: 'ease-out' },
    },
    shake: {
        keyframes: [
            { transform: 'translateX(0)' }, { transform: 'translateX(-9px)' }, { transform: 'translateX(9px)' },
            { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' },
        ],
        options: { duration: 420 },
    },
    pulse: { keyframes: [{ transform: 'scale(1)' }, { transform: 'scale(1.14)' }, { transform: 'scale(1)' }], options: { duration: 500, easing: 'ease-in-out' } },
    spin: { keyframes: [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], options: { duration: 700, easing: 'ease-in-out' } },
    pop: {
        keyframes: [{ transform: 'scale(1)' }, { transform: 'scale(1.3)', offset: 0.4 }, { transform: 'scale(0.95)', offset: 0.7 }, { transform: 'scale(1)' }],
        options: { duration: 450, easing: 'ease-out' },
    },
    glow: {
        keyframes: [
            { boxShadow: '0 0 0 0 rgba(251,191,36,0)' }, { boxShadow: '0 0 32px 10px rgba(251,191,36,0.85)' }, { boxShadow: '0 0 0 0 rgba(251,191,36,0)' },
        ],
        options: { duration: 900, easing: 'ease-out' },
    },
    wobble: {
        keyframes: [
            { transform: 'rotate(0deg)' }, { transform: 'rotate(-8deg)' }, { transform: 'rotate(8deg)' },
            { transform: 'rotate(-4deg)' }, { transform: 'rotate(4deg)' }, { transform: 'rotate(0deg)' },
        ],
        options: { duration: 600 },
    },
};

const usePrefersReducedMotion = (): boolean => {
    const query = '(prefers-reduced-motion: reduce)';
    const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(query).matches);
    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        const mq = window.matchMedia(query);
        const onChange = () => setReduced(mq.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);
    return reduced;
};

/** Scale factor that fits a fixed logical canvas width into its container. */
const useFitScale = (ref: React.RefObject<HTMLDivElement | null>, logicalWidth: number): number => {
    const [k, setK] = useState(1);
    useEffect(() => {
        const el = ref.current;
        if (!el || typeof ResizeObserver === 'undefined') return;
        const ro = new ResizeObserver(entries => setK(entries[0].contentRect.width / logicalWidth));
        ro.observe(el);
        return () => ro.disconnect();
    }, [ref, logicalWidth]);
    return k;
};

/** Own layer so Web Animations never fight the positioning/transform layers. */
const AnimatedLayer: React.FC<{
    anim?: { preset: AnimPreset; n: number };
    reduced: boolean;
    className?: string;
    children: React.ReactNode;
}> = ({ anim, reduced, className, children }) => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const el = ref.current;
        if (!anim || reduced || !el || typeof el.animate !== 'function') return;
        const def = ANIMATIONS[anim.preset];
        el.animate(def.keyframes, def.options);
    }, [anim, reduced]);
    return <div ref={ref} className={className}>{children}</div>;
};

export interface KineticCanvasBlockProps {
    /** New object-based block data, or a legacy { entities, zones, rules } block. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    block?: any;
    /** Previously emitted snapshot, to resume a learner's progress. */
    savedState?: Partial<KineticSnapshot>;
    onComplete?: (result: KineticResult) => void;
    onStateChange?: (snapshot: KineticSnapshot) => void;
}

export const KineticCanvasBlock = ({ block, onComplete, onStateChange, savedState }: KineticCanvasBlockProps) => {
    // Key on content so a parent re-creating the same block object doesn't reset progress.
    const dataKey = JSON.stringify(block ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const data = useMemo(() => normalizeBlock(block), [dataKey]);
    const byId = useMemo(() => indexById(data.objects), [data]);
    const reducer = useMemo(() => createReducer(data), [data]);
    const [state, dispatch] = useReducer(reducer, undefined, () => createInitialState(data, savedState));

    // Live authoring preview: reset when the block definition changes.
    const firstRender = useRef(true);
    useEffect(() => {
        if (firstRender.current) { firstRender.current = false; return; }
        dispatch({ type: 'reset' });
    }, [data]);

    const reducedMotion = usePrefersReducedMotion();
    const logicalW = data.canvas?.width ?? 800;
    const logicalH = data.canvas?.height ?? 500;
    const stageRef = useRef<HTMLDivElement>(null);
    const k = useFitScale(stageRef, logicalW);

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [held, setHeld] = useState<string | null>(null); // keyboard "picked up" token
    const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null);
    const dragMeta = useRef<{ offX: number; offY: number; sx: number; sy: number; moved: boolean } | null>(null);
    const tokenRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const zoneRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const [bannerText, setBannerText] = useState<string | null>(null);
    const [activeEffect, setActiveEffect] = useState<EffectPreset | null>(null);

    const progress = useMemo(() => computeProgress(data, state, byId), [data, state, byId]);
    const bgThemeKey = data.backgroundTheme && KINETIC_BACKGROUNDS[data.backgroundTheme] ? data.backgroundTheme : 'grid';
    const isLightTheme = bgThemeKey === 'parchment';

    // Keep latest callbacks without re-running effects.
    const onStateChangeRef = useRef(onStateChange);
    const onCompleteRef = useRef(onComplete);
    onStateChangeRef.current = onStateChange;
    onCompleteRef.current = onComplete;

    // Persistable snapshot: only committed state (never mid-drag positions).
    useEffect(() => {
        onStateChangeRef.current?.({
            objs: state.objs, placed: state.placed, locked: state.locked, vars: state.vars,
            fired: state.fired, attempts: state.attempts, verified: state.verified,
        });
    }, [state.objs, state.placed, state.locked, state.vars, state.fired, state.attempts, state.verified]);

    useEffect(() => {
        if (!state.verified) return;
        const t = setTimeout(() => onCompleteRef.current?.({
            solved: progress.solved, total: progress.total,
            score: progress.total ? progress.solved / progress.total : 0,
            attempts: state.attempts, vars: state.vars,
        }), 1200);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.verified]);

    useEffect(() => {
        if (data.completion === 'auto' && !state.verified && progress.allSolved) dispatch({ type: 'verify' });
    }, [data.completion, state.verified, progress.allSolved]);

    useEffect(() => {
        if (!state.banner) return;
        setBannerText(state.banner.message);
        const t = setTimeout(() => setBannerText(null), 3600);
        return () => clearTimeout(t);
    }, [state.banner]);

    useEffect(() => {
        if (!state.effect || reducedMotion) return;
        setActiveEffect(state.effect.preset);
        const t = setTimeout(() => setActiveEffect(null), 2200);
        return () => clearTimeout(t);
    }, [state.effect, reducedMotion]);

    useEffect(() => {
        if (!state.sound) return;
        try { void new Audio(state.sound.src).play().catch(() => undefined); } catch { /* autoplay blocked */ }
    }, [state.sound]);

    // ── pointer drag ────────────────────────────────────────────────────────
    const toPercent = (clientX: number, clientY: number) => {
        const r = stageRef.current?.getBoundingClientRect();
        if (!r || r.width === 0) return { x: 0, y: 0 };
        return { x: ((clientX - r.left) / r.width) * 100, y: ((clientY - r.top) / r.height) * 100 };
    };

    const hitTestZone = (x: number, y: number): KineticObject | null => {
        let best: KineticObject | null = null;
        let bestDist = Infinity;
        for (const z of data.objects) {
            const rt = state.objs[z.id];
            if (z.kind !== 'zone' || !rt?.visible) continue;
            const hw = (z.w ?? 20) / 2;
            const hh = (z.h ?? 20) / 2;
            if (x < rt.x - hw || x > rt.x + hw || y < rt.y - hh || y > rt.y + hh) continue;
            const d = Math.hypot(x - rt.x, y - rt.y);
            if (d < bestDist) { best = z; bestDist = d; }
        }
        return best;
    };

    const isInteractive = (tok: KineticObject) => !state.verified && !state.locked[tok.id];

    const onTokenPointerDown = (e: React.PointerEvent<HTMLDivElement>, tok: KineticObject) => {
        e.stopPropagation();
        setSelectedId(tok.id);
        if (!isInteractive(tok)) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        const p = toPercent(e.clientX, e.clientY);
        const rt = state.objs[tok.id];
        dragMeta.current = { offX: p.x - rt.x, offY: p.y - rt.y, sx: e.clientX, sy: e.clientY, moved: false };
        setDrag({ id: tok.id, x: rt.x, y: rt.y });
        dispatch({ type: 'dragStart', id: tok.id });
    };

    const onTokenPointerMove = (e: React.PointerEvent<HTMLDivElement>, tok: KineticObject) => {
        const meta = dragMeta.current;
        if (!drag || drag.id !== tok.id || !meta) return;
        if (!meta.moved && Math.hypot(e.clientX - meta.sx, e.clientY - meta.sy) > 4) meta.moved = true;
        const p = toPercent(e.clientX, e.clientY);
        setDrag({
            id: tok.id,
            x: Math.max(5, Math.min(95, p.x - meta.offX)),
            y: Math.max(6, Math.min(94, p.y - meta.offY)),
        });
    };

    const onTokenPointerUp = (e: React.PointerEvent<HTMLDivElement>, tok: KineticObject) => {
        const meta = dragMeta.current;
        if (!drag || drag.id !== tok.id || !meta) return;
        if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
        const final = drag;
        dragMeta.current = null;
        setDrag(null);
        if (!meta.moved) { dispatch({ type: 'tap', id: tok.id }); return; }
        const zone = hitTestZone(final.x, final.y);
        dispatch({ type: 'drop', id: tok.id, x: final.x, y: final.y, zoneId: zone?.id ?? null });
    };

    // ── keyboard alternative to dragging ────────────────────────────────────
    const firstZoneId = data.objects.find(o => o.kind === 'zone' && state.objs[o.id]?.visible)?.id;

    const cancelHold = (refocusId?: string | null) => {
        setHeld(null);
        if (refocusId) requestAnimationFrame(() => tokenRefs.current[refocusId]?.focus());
    };

    const onTokenKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, tok: KineticObject) => {
        if (!isInteractive(tok)) return;
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (held === tok.id) { cancelHold(); return; }
            setHeld(tok.id);
            setSelectedId(tok.id);
            dispatch({ type: 'dragStart', id: tok.id });
            if (firstZoneId) requestAnimationFrame(() => zoneRefs.current[firstZoneId]?.focus());
        } else if (e.key === 'Escape') {
            cancelHold();
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            dispatch({ type: 'drop', id: tok.id, x: tok.x, y: tok.y, zoneId: null });
        }
    };

    const dropHeldInto = (zoneId: string) => {
        if (!held) return;
        const zr = state.objs[zoneId];
        const id = held;
        dispatch({ type: 'drop', id, x: zr.x, y: zr.y, zoneId });
        cancelHold(id);
    };

    const onZoneKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, zone: KineticObject) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dropHeldInto(zone.id); }
        else if (e.key === 'Escape') cancelHold(held);
    };

    // ── derived view data ───────────────────────────────────────────────────
    const tokens = data.objects.filter(o => o.kind === 'token');
    const zones = data.objects.filter(o => o.kind === 'zone');
    const props = data.objects.filter(o => o.kind === 'prop');
    const selected = selectedId ? byId[selectedId] : undefined;
    const selectedRt = selected ? state.objs[selected.id] : undefined;
    const heldToken = held ? byId[held] : undefined;

    const handleReset = () => {
        dispatch({ type: 'reset' });
        setSelectedId(null); setHeld(null); setDrag(null);
        setBannerText(null); setActiveEffect(null);
    };

    return (
        <div className="my-8 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            {/* Screen-reader announcements */}
            <div className="sr-only" aria-live="polite" role="status">{state.banner?.message}</div>

            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-50/60 dark:bg-slate-950/50">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                            <Sparkles size={12} /> Kinetic Canvas Lab
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {progress.solved} / {progress.total} Aligned
                        </span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                        {data.title || 'Interactive Spatial Assembly'}
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

            {/* Live variable telemetry */}
            <div className="px-6 py-2.5 bg-slate-100/70 dark:bg-slate-950 border-b border-slate-200/70 dark:border-slate-800 flex items-center gap-2.5 overflow-x-auto">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 shrink-0 flex items-center gap-1">
                    <Zap size={12} className="text-amber-500" /> Variables:
                </span>
                {data.variables?.map(v => (
                    <div key={v.name} className="px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1.5 shrink-0 border bg-white border-slate-200 text-slate-600">
                        <span>{v.label ?? v.name}:</span>
                        <span className="text-indigo-600 tabular-nums">{String(state.vars[v.name])}</span>
                    </div>
                ))}
                {tokens.map(tok => {
                    const zoneLabel = state.placed[tok.id] ? byId[state.placed[tok.id]]?.label : undefined;
                    const rt = state.objs[tok.id];
                    return (
                        <div key={tok.id} className={`px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1.5 shrink-0 border ${zoneLabel ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-600'}`}>
                            <span>{tok.variableName || tok.label}:</span>
                            <span className="text-indigo-600">{zoneLabel ?? 'Unplaced'}</span>
                            {tok.resize && <span className="opacity-70">({rt.scale.toFixed(1)}x)</span>}
                            {tok.rotate && <span className="opacity-70">({rt.rotation}°)</span>}
                        </div>
                    );
                })}
            </div>

            {/* Stage */}
            <div className="p-4 sm:p-6 bg-slate-100 dark:bg-slate-950">
                <div className={`relative w-full rounded-[2rem] overflow-hidden border-2 border-slate-200 dark:border-slate-800 shadow-inner select-none touch-none ${KINETIC_BACKGROUNDS[bgThemeKey]}`}>
                    {/* Measured box: height follows the scaled logical canvas */}
                    <div ref={stageRef} className="relative w-full overflow-hidden" style={{ height: logicalH * k }} onPointerDown={() => setSelectedId(null)}>
                        <div className="absolute left-0 top-0" style={{ width: logicalW, height: logicalH, transform: `scale(${k})`, transformOrigin: 'top left' }}>

                            {bannerText && (
                                <div aria-hidden="true" className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-5 py-2 rounded-full bg-slate-900/90 text-white backdrop-blur-md shadow-xl border border-white/20 text-xs font-black flex items-center gap-2 whitespace-nowrap">
                                    <Sparkles size={14} className="text-amber-400 shrink-0" />
                                    <span>{bannerText}</span>
                                </div>
                            )}

                            {activeEffect === 'march' && (
                                <div className="absolute inset-x-0 bottom-5 z-30 pointer-events-none flex items-center justify-center animate-in slide-in-from-left-full duration-700">
                                    <div className="px-6 py-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest shadow-2xl flex items-center gap-2 border-2 border-amber-200">
                                        <Flag size={16} /> Legion &amp; chariot advance!
                                    </div>
                                </div>
                            )}
                            {activeEffect === 'tilt' && (
                                <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
                                    <div className="w-56 h-2.5 bg-indigo-400 rounded-full shadow-[0_0_30px_rgba(99,102,241,0.9)] animate-spin" style={{ animationDuration: '1.4s' }} />
                                </div>
                            )}
                            {activeEffect === 'flash' && (
                                <div className="absolute inset-0 z-30 pointer-events-none bg-indigo-500/20 animate-pulse flex items-center justify-center">
                                    <div className="w-28 h-28 rounded-full bg-emerald-400/30 blur-2xl animate-ping" />
                                </div>
                            )}

                            {/* Zones */}
                            {zones.map(zone => {
                                const rt = state.objs[zone.id];
                                if (!rt?.visible) return null;
                                const occupants = tokens.filter(t => state.placed[t.id] === zone.id);
                                const hasCorrect = occupants.some(t => isCorrectPlacement(t, zone));
                                const free = occupants.length < (zone.capacity ?? 1);
                                return (
                                    <div
                                        key={zone.id}
                                        className="absolute z-10"
                                        style={{
                                            left: `${rt.x}%`, top: `${rt.y}%`, width: `${zone.w ?? 20}%`, height: `${zone.h ?? 20}%`,
                                            transform: `translate(-50%, -50%) scale(${rt.scale}) rotate(${rt.rotation}deg)`,
                                        }}
                                    >
                                        <AnimatedLayer anim={state.anims[zone.id]} reduced={reducedMotion} className="h-full w-full rounded-3xl">
                                            <div
                                                ref={el => { zoneRefs.current[zone.id] = el; }}
                                                role="button"
                                                tabIndex={held ? 0 : -1}
                                                aria-disabled={!held}
                                                aria-label={`Drop zone: ${zone.label}${occupants.length ? `. Contains ${occupants.map(o => o.label).join(', ')}` : '. Empty'}`}
                                                onClick={() => dropHeldInto(zone.id)}
                                                onKeyDown={e => onZoneKeyDown(e, zone)}
                                                className={`h-full w-full rounded-3xl border-2 border-dashed transition-all duration-300 motion-reduce:transition-none flex flex-col items-center justify-center p-2 text-center outline-none focus-visible:ring-4 focus-visible:ring-indigo-300 ${
                                                    hasCorrect ? 'border-emerald-400 bg-emerald-500/15'
                                                    : occupants.length ? 'border-indigo-400 bg-indigo-500/15'
                                                    : isLightTheme ? 'border-slate-400/70 bg-white/50 text-slate-600' : 'border-slate-600/80 bg-slate-800/40 text-slate-300'
                                                } ${held && free ? 'ring-2 ring-indigo-300' : ''}`}
                                            >
                                                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{zone.label}</span>
                                                {zone.sublabel && <span className="text-[9px] opacity-60">{zone.sublabel}</span>}
                                            </div>
                                        </AnimatedLayer>
                                    </div>
                                );
                            })}

                            {/* Props: decorative or tappable reaction targets */}
                            {props.map(p => {
                                const rt = state.objs[p.id];
                                if (!rt?.visible) return null;
                                const tappable = data.rules.some(r => r.when.type === 'tap' && matchRef(r.when.object, p.id, byId));
                                return (
                                    <div
                                        key={p.id}
                                        className="absolute z-10"
                                        style={{ left: `${rt.x}%`, top: `${rt.y}%`, transform: `translate(-50%, -50%) scale(${rt.scale}) rotate(${rt.rotation}deg)` }}
                                    >
                                        <AnimatedLayer anim={state.anims[p.id]} reduced={reducedMotion} className="rounded-2xl">
                                            <div
                                                role={tappable ? 'button' : undefined}
                                                tabIndex={tappable ? 0 : undefined}
                                                aria-label={tappable ? p.label : undefined}
                                                onPointerDown={e => e.stopPropagation()}
                                                onClick={tappable ? () => dispatch({ type: 'tap', id: p.id }) : undefined}
                                                onKeyDown={tappable ? e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dispatch({ type: 'tap', id: p.id }); } } : undefined}
                                                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-indigo-300 ${tappable ? 'cursor-pointer' : ''}`}
                                            >
                                                {p.emoji && <span className="text-4xl leading-none" aria-hidden="true">{p.emoji}</span>}
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${isLightTheme ? 'text-slate-700' : 'text-slate-300'}`}>{p.label}</span>
                                            </div>
                                        </AnimatedLayer>
                                    </div>
                                );
                            })}

                            {/* Draggable tokens */}
                            {tokens.map(tok => {
                                const rt = state.objs[tok.id];
                                if (!rt?.visible) return null;
                                const isDragging = drag?.id === tok.id;
                                const pos = isDragging && drag ? drag : rt;
                                const zoneId = state.placed[tok.id];
                                const zone = zoneId ? byId[zoneId] : undefined;
                                const correct = !!zone && isCorrectPlacement(tok, zone);
                                const locked = !!state.locked[tok.id];
                                const isHeld = held === tok.id;
                                const colorClasses = KINETIC_COLORS[tok.color || 'indigo'] || KINETIC_COLORS.indigo;
                                return (
                                    <div
                                        key={tok.id}
                                        className={`absolute ${isDragging ? 'z-30' : 'z-20'} ${isDragging ? '' : 'transition-[left,top] duration-200 motion-reduce:transition-none'}`}
                                        style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
                                    >
                                        <div style={{ transform: `scale(${rt.scale}) rotate(${rt.rotation}deg)` }} className="transition-transform duration-200 motion-reduce:transition-none">
                                            <AnimatedLayer anim={state.anims[tok.id]} reduced={reducedMotion} className="rounded-2xl">
                                                <div
                                                    ref={el => { tokenRefs.current[tok.id] = el; }}
                                                    role="button"
                                                    tabIndex={held && !isHeld ? -1 : 0}
                                                    aria-pressed={isHeld}
                                                    aria-label={`${tok.label}${tok.sublabel ? `, ${tok.sublabel}` : ''}. ${zone ? `Placed in ${zone.label}.` : 'Not placed.'} ${locked ? 'Locked.' : 'Press Enter to pick up.'}`}
                                                    onFocus={() => setSelectedId(tok.id)}
                                                    onPointerDown={e => onTokenPointerDown(e, tok)}
                                                    onPointerMove={e => onTokenPointerMove(e, tok)}
                                                    onPointerUp={e => onTokenPointerUp(e, tok)}
                                                    onPointerCancel={() => { dragMeta.current = null; setDrag(null); }}
                                                    onKeyDown={e => onTokenKeyDown(e, tok)}
                                                    style={{ touchAction: 'none' }}
                                                    className={`px-4 py-3 rounded-2xl border-2 shadow-xl outline-none focus-visible:ring-4 focus-visible:ring-white ${colorClasses} ${
                                                        isInteractive(tok) ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
                                                    } ${isDragging ? 'shadow-2xl ring-4 ring-white/40' : ''} ${selectedId === tok.id ? 'ring-4 ring-indigo-300' : ''} ${isHeld ? 'ring-4 ring-white' : ''}`}
                                                >
                                                    <div className="flex items-center gap-2 whitespace-nowrap">
                                                        <Move size={14} className="opacity-70 shrink-0" aria-hidden="true" />
                                                        <div className="text-left">
                                                            <div className="font-black text-sm leading-tight">{tok.label}</div>
                                                            {tok.sublabel && <div className="text-[9px] font-bold uppercase tracking-wider opacity-80">{tok.sublabel}</div>}
                                                        </div>
                                                        {correct && <CheckCircle2 size={14} className="text-white shrink-0 ml-1" aria-hidden="true" />}
                                                    </div>
                                                </div>
                                            </AnimatedLayer>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Keyboard hint */}
                {heldToken && (
                    <div role="status" className="mt-3 px-4 py-2.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700">
                        Holding “{heldToken.label}”. Tab to a zone and press Enter to drop it, or Esc to cancel.
                    </div>
                )}

                {/* Transform dock */}
                {selected && selectedRt && (selected.resize || selected.rotate) && (
                    <div className="mt-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200 shadow-md flex flex-wrap items-center justify-between gap-6">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                            Transform: {selected.label}
                        </span>
                        <div className="flex flex-wrap items-center gap-6 flex-1 justify-end">
                            {selected.resize && (
                                <label className="flex items-center gap-3 min-w-[170px]">
                                    <Maximize2 size={14} className="text-slate-400" aria-hidden="true" />
                                    <span className="sr-only">Size of {selected.label}</span>
                                    <input
                                        type="range" min={selected.resize.min} max={selected.resize.max} step={selected.resize.step ?? 0.1}
                                        value={selectedRt.scale} disabled={!isInteractive(selected)}
                                        onChange={e => dispatch({ type: 'transform', id: selected.id, prop: 'scale', value: parseFloat(e.target.value) })}
                                        className="flex-1 accent-indigo-600 cursor-pointer disabled:opacity-50"
                                    />
                                    <span className="text-xs font-black text-slate-700 tabular-nums w-9">{selectedRt.scale.toFixed(1)}x</span>
                                </label>
                            )}
                            {selected.rotate && (
                                <label className="flex items-center gap-3 min-w-[170px]">
                                    <RotateCw size={14} className="text-slate-400" aria-hidden="true" />
                                    <span className="sr-only">Rotation of {selected.label}</span>
                                    <input
                                        type="range" min={selected.rotate.min} max={selected.rotate.max} step={selected.rotate.step ?? 5}
                                        value={selectedRt.rotation} disabled={!isInteractive(selected)}
                                        onChange={e => dispatch({ type: 'transform', id: selected.id, prop: 'rotation', value: parseInt(e.target.value, 10) })}
                                        className="flex-1 accent-indigo-600 cursor-pointer disabled:opacity-50"
                                    />
                                    <span className="text-xs font-black text-slate-700 tabular-nums w-9">{selectedRt.rotation}°</span>
                                </label>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                <span className="text-xs font-bold text-slate-500">
                    {progress.allSolved
                        ? '✨ All spatial interactions aligned!'
                        : 'Drag objects into the target zones, or press Enter on an object to pick it up.'}
                    {state.attempts > 0 && <span className="ml-2 opacity-70">Misses: {state.attempts}</span>}
                </span>
                {data.completion !== 'auto' && (
                    <button
                        type="button"
                        onClick={() => dispatch({ type: 'verify' })}
                        disabled={state.verified}
                        className={`px-7 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center gap-2 ${
                            state.verified || progress.allSolved ? 'bg-emerald-500 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        }`}
                    >
                        {state.verified ? <><CheckCircle2 size={16} /> Completed</> : <><Sparkles size={16} /> Verify Canvas</>}
                    </button>
                )}
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
