// src/components/LessonView.tsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  HelpCircle, CheckCircle2, X, Edit3, MessageSquare, 
  MessageCircle, ArrowLeft, ArrowRight, Info, Zap, BookOpen,
  Play, Square, Search, MousePointerClick, Palette, Eraser, Volume2, AlertTriangle, Gamepad2, Layers, Mic
} from 'lucide-react';
import PronunciationLab from './PronunciationLab'; 
import LiveRoleplayArena from './LiveRoleplayArena'; 

export interface LessonViewProps {
    lessonId?: string | null;
    lessons?: any[];
    lesson: any;
    onFinish: () => void;
    isInstructor?: boolean;
}

// ============================================================================
//  INTERACTIVE RENDERERS 
// ============================================================================

const QuizBlockRenderer = ({ block }: any) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const data = block?.content || block?.data || block || {};
    const question = typeof data.question === 'string' ? data.question : String(data.question || "Missing Question Data");
    
    let options = data.options || [];
    if (!Array.isArray(options)) options = [];

    const normalizedOptions = options.map((opt: any, idx: number) => {
        if (typeof opt === 'string' || typeof opt === 'number') return { id: `opt_${idx}`, text: String(opt) };
        return { id: String(opt?.id || `opt_${idx}`), text: String(opt?.text || opt?.label || opt?.value || "Unknown Option") };
    });

    let correctId = data.correctId;
    if (correctId === undefined) {
         if (data.correctIndex !== undefined) correctId = normalizedOptions[data.correctIndex]?.id;
         else if (data.correctAnswer) {
             const found = normalizedOptions.find((o: any) => o.text === String(data.correctAnswer));
             correctId = found?.id;
         }
    }
    if (correctId === undefined && normalizedOptions.length > 0) correctId = normalizedOptions[0].id;
    const isCorrect = selectedId === correctId;

    return (
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-200/60 dark:border-slate-800/60 shadow-sm my-6 relative overflow-hidden transition-colors">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
            <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20 shrink-0">
                    <HelpCircle size={18} strokeWidth={2.5} />
                </div>
                <h3 className="text-[11px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">Knowledge Check</h3>
            </div>
            
            <h4 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-6 leading-snug tracking-tight">{question}</h4>
            
            <div className="space-y-3">
                {normalizedOptions.length === 0 ? (
                    <p className="text-slate-400 font-medium italic p-4 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">No options provided.</p>
                ) : (
                    normalizedOptions.map((opt: any) => {
                        const isSelected = selectedId === opt.id;
                        const isOptCorrect = isSubmitted && opt.id === correctId;
                        const isOptWrong = isSubmitted && isSelected && opt.id !== correctId;

                        let btnStyle = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5";
                        if (isSelected && !isSubmitted) btnStyle = "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20 dark:shadow-indigo-900/30";
                        if (isOptCorrect) btnStyle = "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20";
                        if (isOptWrong) btnStyle = "bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/20";

                        return (
                            <button 
                                key={opt.id} disabled={isSubmitted} onClick={() => setSelectedId(opt.id)}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl border font-semibold text-sm text-left transition-all hover:shadow-sm hover:-translate-y-0.5 active:scale-[0.98] disabled:active:scale-100 disabled:hover:-translate-y-0 disabled:hover:shadow-none min-h-[60px] ${btnStyle}`}
                            >
                                <span className="pr-4">{opt.text}</span>
                                {isOptCorrect && <CheckCircle2 size={18} strokeWidth={2.5} className="text-white shrink-0" />}
                                {isOptWrong && <X size={18} strokeWidth={2.5} className="text-white shrink-0" />}
                            </button>
                        );
                    })
                )}
            </div>

            {!isSubmitted && selectedId !== null ? (
                <button onClick={() => setIsSubmitted(true)} className="mt-6 w-full py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-800 dark:hover:bg-indigo-500 hover:shadow-lg active:scale-95 transition-all shadow-md">
                    Check Answer
                </button>
            ) : isSubmitted && (
                <div className={`mt-6 p-4 rounded-xl flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center animate-in zoom-in-95 duration-300 border ${isCorrect ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'}`}>
                    <span className="font-bold text-sm flex items-center gap-2">
                        {isCorrect ? <><CheckCircle2 size={18} strokeWidth={2.5}/> Correct!</> : <><X size={18} strokeWidth={2.5}/> Incorrect</>}
                    </span>
                    {!isCorrect && (
                        <button onClick={() => { setIsSubmitted(false); setSelectedId(null); }} className="w-full sm:w-auto px-5 py-2.5 bg-white dark:bg-slate-800 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm hover:shadow active:scale-95 transition-all text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30">
                            Try Again
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

const VocabListBlockRenderer = ({ block }: any) => {
    const [index, setIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    const items = Array.isArray(block.items) ? block.items : [];
    if (items.length === 0) return null;

    const currentCard = items[index] || items[0];

    const handleNav = (dir: number) => {
        setIsFlipped(false);
        setTimeout(() => {
            setIndex((prev) => (prev + dir + items.length) % items.length);
        }, 150); 
    };

    return (
        <div className="py-6 my-4 animate-in fade-in slide-in-from-bottom-4 relative">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20 shrink-0">
                    <Layers size={18} strokeWidth={2.5} />
                </div>
                <h3 className="text-[11px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">{String(block.title || 'Lexicon')}</h3>
            </div>

            <div className="w-full" style={{ perspective: '1000px' }}>
                <div 
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="relative w-full h-80 md:h-96 cursor-pointer transition-transform duration-500" 
                    style={{ transformStyle: 'preserve-3d', WebkitTransformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                >
                    <div 
                        className="absolute inset-0 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-md border border-slate-200/60 dark:border-slate-800 flex flex-col items-center justify-center p-8 text-center"
                        style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                    >
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider absolute top-6">Term {index + 1} of {items.length}</span>
                        <h3 className="text-3xl md:text-4xl font-black text-indigo-600 dark:text-indigo-400 leading-tight tracking-tight">{String(currentCard.term || '')}</h3>
                        <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider absolute bottom-6 animate-pulse bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700">Tap to Flip</p>
                    </div>

                    <div 
                        className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-[2.5rem] shadow-lg border border-indigo-500 flex flex-col items-center justify-center p-8 text-white text-center" 
                        style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                        <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider absolute top-6">Definition</span>
                        <div className="overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full pt-4 pb-8">
                            <p className="text-lg md:text-xl font-medium leading-relaxed">{String(currentCard.definition || '')}</p>
                        </div>
                        <p className="text-[10px] font-semibold text-indigo-200 uppercase tracking-wider absolute bottom-6">Tap to Flip Back</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center mt-6 px-2">
                <button onClick={() => handleNav(-1)} className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:border-indigo-300 dark:hover:border-indigo-500/50 active:scale-95 transition-all">
                    <ArrowLeft size={20} strokeWidth={2.5} />
                </button>
                
                <div className="flex gap-2">
                    {items.map((_: any, i: number) => (
                        <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? 'w-5 bg-indigo-500' : 'w-1.5 bg-slate-200 dark:bg-slate-700'}`} />
                    ))}
                </div>

                <button onClick={() => handleNav(1)} className="p-3.5 bg-indigo-600 text-white rounded-2xl shadow-md shadow-indigo-500/20 active:scale-95 transition-all hover:bg-indigo-500 hover:-translate-y-0.5">
                    <ArrowRight size={20} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
};

type WordItem = { id: string; word: string };

const FillBlankBlockRenderer = ({ block }: any) => {
    const data = block?.content || block?.data || block || {};
    const rawText = typeof data.text === 'string' ? data.text : "Missing text [here].";
    
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

    const distractorsJson = JSON.stringify(data.options || data.distractors || []);

    const distractors = useMemo(() => {
        let rawOptions = [];
        try { rawOptions = JSON.parse(distractorsJson); } catch (e) {}
        if (!Array.isArray(rawOptions)) rawOptions = typeof rawOptions === 'string' ? [rawOptions] : [];
        return rawOptions.map((opt: any) => {
            if (typeof opt === 'string' || typeof opt === 'number') return String(opt);
            if (opt && typeof opt === 'object') return String(opt.text || opt.label || opt.value || "");
            return "";
        }).filter(Boolean);
    }, [distractorsJson]);

    const initialWordBank = useMemo(() => {
        return [...correctAnswers, ...distractors]
            .map((w, i) => ({ id: `word_${i}_${w}`, word: w }))
            .sort(() => Math.random() - 0.5);
    }, [correctAnswers, distractors]);

    const [wordBank, setWordBank] = useState<WordItem[]>(initialWordBank);
    const [filledBlanks, setFilledBlanks] = useState<(WordItem | null)[]>(Array(correctAnswers.length).fill(null));
    const [isChecked, setIsChecked] = useState(false);

    useEffect(() => {
        setWordBank(initialWordBank);
        setFilledBlanks(Array(correctAnswers.length).fill(null));
        setIsChecked(false);
    }, [initialWordBank, correctAnswers.length]);

    const handleBankClick = (item: WordItem) => {
        if (isChecked) return;
        const firstEmptyIdx = filledBlanks.indexOf(null); 
        if (firstEmptyIdx !== -1) {
            const newFilled = [...filledBlanks];
            newFilled[firstEmptyIdx] = item;
            setFilledBlanks(newFilled);
            setWordBank(wordBank.filter(w => w.id !== item.id));
        }
    };

    const handleBlankClick = (item: WordItem | null, idx: number) => {
        if (isChecked || !item) return;
        const newFilled = [...filledBlanks];
        newFilled[idx] = null; 
        setFilledBlanks(newFilled);
        setWordBank([...wordBank, item]);
    };

    const isComplete = filledBlanks.length > 0 && filledBlanks.indexOf(null) === -1;
    const checkAnswers = () => setIsChecked(true); 
    const isEntirelyCorrect = isChecked && filledBlanks.every((item: WordItem | null, i: number) => item?.word === correctAnswers[i]);

    return (
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-200/60 dark:border-slate-800 shadow-sm my-6 relative flex flex-col transition-colors">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-xl flex items-center justify-center border border-amber-100 dark:border-amber-500/20 shrink-0">
                    <Edit3 size={18} strokeWidth={2.5}/>
                </div>
                <h3 className="text-[11px] font-bold text-amber-500 dark:text-amber-500 uppercase tracking-wider">Vocabulary Drill</h3>
            </div>

            <div className="sticky top-4 z-30 mb-6 -mx-2 px-2">
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[1.5rem] p-4 border border-slate-200/60 dark:border-slate-700/50 shadow-sm flex flex-col gap-2 max-h-[25vh] transition-all duration-300">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center shrink-0 mb-1">Word Bank</span>
                    <div className="flex flex-wrap gap-2 justify-center items-start overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full pb-1">
                        {wordBank.length === 0 && !isChecked ? (
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 m-auto">
                                <CheckCircle2 size={16} className="text-emerald-500" strokeWidth={2.5} /> All placed
                            </span>
                        ) : (
                            wordBank.map((item) => (
                                <button 
                                    key={item.id} onClick={() => handleBankClick(item)} disabled={isChecked}
                                    className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl shadow-sm hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-400 hover:-translate-y-0.5 transition-all disabled:opacity-50 active:scale-95 text-sm"
                                >
                                    {item.word}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="text-lg md:text-xl font-medium text-slate-800 dark:text-slate-200 leading-[2.5rem] md:leading-[3rem] flex flex-wrap items-center gap-y-3 mb-6 tracking-tight">
                {textParts.map((part: string, i: number) => {
                    const isLast = i === textParts.length - 1;
                    const filledItem = filledBlanks[i];
                    
                    let blankStyle = "min-w-[80px] h-10 bg-slate-50 dark:bg-slate-950 border-b-2 border-slate-300 dark:border-slate-700 mx-1 flex items-center justify-center px-3 cursor-pointer transition-all rounded-t-lg";
                    if (filledItem) blankStyle = "min-w-[80px] h-10 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400 font-bold rounded-xl mx-1 flex items-center justify-center px-4 cursor-pointer shadow-sm active:scale-95 hover:-translate-y-0.5 transition-all text-base";
                    
                    if (isChecked && filledItem) {
                        const isCorrect = filledItem.word === correctAnswers[i];
                        blankStyle = `min-w-[80px] h-10 font-bold rounded-xl mx-1 flex items-center justify-center px-4 shadow-sm text-white text-base ${isCorrect ? 'bg-emerald-500 border-emerald-500' : 'bg-rose-500 border-rose-500'}`;
                    }

                    return (
                        <React.Fragment key={`part_${i}`}>
                            <span className="py-1">{String(part)}</span>
                            {!isLast && (
                                <button onClick={() => handleBlankClick(filledItem, i)} disabled={isChecked} className={blankStyle}>
                                    {filledItem ? String(filledItem.word) : " "}
                                </button>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {isComplete && !isChecked && (
                <div className="mt-4 pt-6 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom-2">
                    <button onClick={checkAnswers} className="w-full py-4 bg-emerald-500 text-white rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-emerald-400 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all">
                        Check Answers
                    </button>
                </div>
            )}

            {isChecked && (
                <div className="mt-4 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-center animate-in zoom-in-95">
                    {isEntirelyCorrect ? (
                        <div className="w-full py-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-xl font-bold flex items-center justify-center gap-2">
                            <CheckCircle2 size={20} strokeWidth={2.5}/> Perfectly Placed!
                        </div>
                    ) : (
                        <button onClick={() => { 
                            setFilledBlanks(Array(correctAnswers.length).fill(null)); 
                            setWordBank(initialWordBank); 
                            setIsChecked(false); 
                        }} className="w-full py-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 rounded-xl font-bold hover:bg-rose-100 dark:hover:bg-rose-500/20 active:scale-95 transition-all">
                            Try Again
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

// 🔥 NEW: LIVE AUDIO ROLEPLAY BLOCK
const LiveRoleplayBlockRenderer = ({ block, onLaunch }: { block: any, onLaunch: (prompt: string) => void }) => {
    return (
        <div className="bg-slate-950 p-6 md:p-10 rounded-[2.5rem] shadow-xl my-8 text-white relative overflow-hidden group border border-slate-800">
            {/* Cinematic background flare */}
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-cyan-500/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-cyan-500/30 transition-colors duration-700" />
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-indigo-500/30 transition-colors duration-700" />
            
            <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-slate-900 border border-cyan-500/30 rounded-2xl flex items-center justify-center text-cyan-400 mb-6 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
                    <Mic size={24} strokeWidth={2.5} />
                </div>
                
                <h3 className="text-2xl md:text-3xl font-black mb-2 leading-tight tracking-tight">
                    {String(block.title || "Live Simulation")}
                </h3>
                
                <div className="flex gap-3 items-center justify-center mb-6">
                    <div className="px-3 py-1 bg-slate-800/80 border border-slate-700/50 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        AI: <span className="text-cyan-400">{block.metadata?.aiPersona || 'Unknown'}</span>
                    </div>
                    <div className="px-3 py-1 bg-slate-800/80 border border-slate-700/50 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        You: <span className="text-indigo-400">{block.metadata?.studentRole || 'Unknown'}</span>
                    </div>
                </div>

                <p className="text-slate-300 font-medium leading-relaxed max-w-md mb-8">
                    Your Objective: <strong className="text-white">{block.metadata?.objective || 'Complete the scenario successfully.'}</strong>
                </p>

                <button 
                    onClick={() => onLaunch(block.prompt)}
                    className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg hover:shadow-cyan-500/25 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <Mic size={18} strokeWidth={2.5} /> Enter Arena
                </button>
            </div>
        </div>
    );
};

const ScenarioBlockRenderer = ({ block }: any) => {
    const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
    const title = typeof block.title === 'string' ? block.title : (typeof block?.content?.title === 'string' ? block.content.title : "Real-World Scenario");
    const context = typeof block.context === 'string' ? block.context : (typeof block?.content?.context === 'string' ? block.content.context : "Scenario context goes here...");
    
    let options = block.options || block?.content?.options || block?.data?.options || [];
    if (!Array.isArray(options)) options = [];
    
    return (
        <div className="bg-slate-900 p-6 md:p-8 rounded-[2.5rem] shadow-xl my-6 text-white relative overflow-hidden group border border-slate-800">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-rose-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-rose-500/20 transition-colors duration-700" />
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 bg-rose-500/10 text-rose-400 rounded-xl flex items-center justify-center border border-rose-500/20 shrink-0">
                        <MessageSquare size={18} strokeWidth={2.5}/>
                    </div>
                    <h3 className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">Interactive Branch</h3>
                </div>
                <h4 className="text-xl md:text-2xl font-bold mb-3 leading-tight tracking-tight">{title}</h4>
                <p className="text-sm md:text-base text-slate-300 font-medium leading-relaxed mb-8 italic">"{context}"</p>
                <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">How do you respond?</p>
                    {options.map((opt: any, i: number) => {
                        const safeOpt = String(opt);
                        return (
                            <button 
                                key={i} onClick={() => setSelectedOpt(safeOpt)}
                                className={`w-full p-4 border rounded-xl text-left font-semibold text-sm transition-all hover:-translate-y-0.5 active:scale-[0.98] ${
                                    selectedOpt === safeOpt ? 'bg-rose-500 border-rose-400 text-white shadow-md shadow-rose-500/20' : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/50 hover:border-slate-600 text-slate-200'
                                }`}
                            >
                                {safeOpt}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

type SortItem = { id: string; label: string; emoji: string };

const TapSortBlockRenderer = ({ block }: any) => {
    const itemsJson = JSON.stringify(block.items || []);
    const catsJson = JSON.stringify(block.categories || []);

    const normalizedItems = useMemo(() => {
        let rawItems = [];
        try { rawItems = JSON.parse(itemsJson); } catch (e) {}
        if (!Array.isArray(rawItems)) rawItems = [];
        return rawItems.map((item: any, idx: number) => {
            if (typeof item === 'string' || typeof item === 'number') return { id: `item_${idx}`, label: String(item), emoji: '🔹' };
            return { 
                id: String(item?.id || `item_${idx}`), 
                label: String(item?.label || item?.text || ''), 
                emoji: String(item?.emoji || '🔹')
            };
        });
    }, [itemsJson]);

    const parsedCategories = useMemo(() => {
        let cats = [];
        try { cats = JSON.parse(catsJson); } catch (e) {}
        if (!Array.isArray(cats)) cats = [];
        return cats.map((c: any) => String(c));
    }, [catsJson]);

    const [items, setItems] = useState<SortItem[]>(normalizedItems);
    const [placed, setPlaced] = useState<Record<string, SortItem[]>>({});
    const [selectedItem, setSelectedItem] = useState<SortItem | null>(null);

    useEffect(() => {
        setItems(normalizedItems);
        const init: Record<string, SortItem[]> = {};
        parsedCategories.forEach((c: string) => { init[c] = []; });
        setPlaced(init);
        setSelectedItem(null);
    }, [normalizedItems, parsedCategories]);

    const handleBucketClick = (category: string) => {
        if (selectedItem) {
            setPlaced(prev => ({...prev, [category]: [...(prev[category] || []), selectedItem]}));
            setItems(items.filter((i: SortItem) => i.id !== selectedItem.id));
            setSelectedItem(null);
        }
    };

    return (
        <div className="bg-amber-50 dark:bg-amber-500/5 p-6 md:p-8 rounded-[2.5rem] border border-amber-200 dark:border-amber-900/30 my-8 shadow-sm relative flex flex-col transition-colors">
            <div className="flex items-center justify-center gap-3 mb-6">
                <MousePointerClick className="text-amber-500" size={24} strokeWidth={2.5} />
                <h3 className="text-xl md:text-2xl font-bold text-amber-900 dark:text-amber-500 text-center tracking-tight">{String(block.title || 'Sort the Items!')}</h3>
            </div>
            
            <div className="sticky top-4 z-30 mb-8 -mx-2 px-2">
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[1.5rem] p-4 border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col gap-2 max-h-[30vh] transition-all duration-300">
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider text-center shrink-0 mb-1">Items to Sort</span>
                    <div className="flex flex-wrap justify-center gap-2 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full pb-1">
                        {items.length === 0 && <p className="text-amber-500 font-bold uppercase tracking-wider m-auto flex items-center gap-2 text-xs"><CheckCircle2 size={16} strokeWidth={2.5}/> All sorted!</p>}
                        {items.map((item: SortItem) => (
                            <button 
                                key={item.id} 
                                onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)} 
                                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300 shadow-sm border ${selectedItem?.id === item.id ? 'bg-indigo-600 text-white scale-110 -translate-y-0.5 border-indigo-600 ring-2 ring-indigo-500/30' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:scale-105 active:scale-95'}`}
                            >
                                {item.emoji} {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {parsedCategories.map((cat: string) => {
                    return (
                        <button key={cat} onClick={() => handleBucketClick(cat)} className={`p-6 rounded-[2rem] border transition-all flex flex-col items-center gap-4 shadow-sm ${selectedItem ? 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/10 animate-pulse cursor-pointer hover:border-indigo-500' : 'border-amber-200 dark:border-amber-700/50 bg-amber-100/30 dark:bg-amber-900/10 cursor-default'}`}>
                            <h4 className="font-bold text-amber-900 dark:text-amber-500 text-lg md:text-xl text-center leading-tight">{cat}</h4>
                            <div className="flex flex-wrap justify-center gap-2">
                                {placed[cat]?.map((item: SortItem) => (
                                    <div key={item.id} className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg text-sm font-semibold shadow-sm flex items-center gap-1 text-slate-700 dark:text-slate-300">
                                        {item.emoji} <span className="inline">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const AudioStoryBlockRenderer = ({ block }: any) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const togglePlay = () => setIsPlaying(!isPlaying);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-200/60 dark:border-slate-800/60 my-8 transition-colors">
            <div className="relative">
                <img src={String(block.imageUrl || 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?q=80&w=800&auto=format&fit=crop')} alt="Story visual" className="w-full h-64 md:h-80 object-cover" />
                <button onClick={togglePlay} className={`absolute -bottom-7 right-8 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 border-2 border-white dark:border-slate-900 ${isPlaying ? 'bg-rose-500 text-white scale-110' : 'bg-indigo-600 text-white hover:scale-105'}`}>
                    {isPlaying ? <Square fill="currentColor" size={20} /> : <Play fill="currentColor" size={24} className="ml-1" />}
                </button>
            </div>
            <div className="p-8 md:p-10 pt-10">
                <h3 className="text-[11px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Volume2 size={16} strokeWidth={2.5}/> Read Along</h3>
                <p className={`text-2xl md:text-3xl font-bold text-slate-900 dark:text-white leading-snug tracking-tight transition-colors duration-500 ${isPlaying ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>{String(block.text || "The legend says they looked for an eagle on a cactus...")}</p>
            </div>
        </div>
    );
};

const ImageHotspotBlockRenderer = ({ block }: any) => {
    const [activeSpot, setActiveSpot] = useState<number | null>(null);

    return (
        <div className="bg-slate-950 p-6 md:p-8 rounded-[2.5rem] shadow-xl my-8 border border-slate-800">
            <div className="flex items-center justify-center gap-3 mb-6"><Search className="text-cyan-400" size={20} strokeWidth={2.5} /><h3 className="text-xl md:text-2xl font-bold text-white text-center tracking-tight">{String(block.title || 'Explore the Map!')}</h3></div>
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900">
                <img src={String(block.imageUrl || 'https://images.unsplash.com/photo-1565670119853-23910c2830f3?q=80&w=800&auto=format&fit=crop')} className="w-full h-auto opacity-80" alt="Explorer Map" />
                {(Array.isArray(block.hotspots) ? block.hotspots : []).map((spot: any, i: number) => (
                    <React.Fragment key={i}>
                        <button onClick={() => setActiveSpot(activeSpot === i ? null : i)} className="absolute w-8 h-8 md:w-10 md:h-10 bg-rose-500 rounded-full border-2 border-white shadow-[0_0_15px_rgba(244,63,94,0.6)] flex items-center justify-center animate-pulse hover:scale-110 transition-transform z-10" style={{ top: `${spot.y || 0}%`, left: `${spot.x || 0}%`, transform: 'translate(-50%, -50%)' }}>
                            <Search size={16} className="text-white" strokeWidth={2.5} />
                        </button>
                        {activeSpot === i && (
                            <div className="absolute z-20 bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-xl border border-slate-200/50 w-56 text-center animate-in zoom-in-95 duration-200" style={{ top: `${spot.y || 0}%`, left: `${spot.x || 0}%`, transform: 'translate(-50%, -115%)' }}>
                                <h4 className="text-lg font-bold text-indigo-700 mb-1.5 leading-tight">{String(spot.title || '')}</h4>
                                <p className="text-xs font-medium text-slate-600 leading-relaxed">{String(spot.description || '')}</p>
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r border-b border-slate-200/50 rotate-45"></div>
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

const DrawingBlockRenderer = ({ block }: any) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#ef4444'); 
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#1e293b'];

    const getCoordinates = (e: any, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();
        if (e.touches && e.touches.length > 0) {
            return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
        }
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const startDrawing = (e: any) => {
        if (e.cancelable) e.preventDefault(); 
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const { x, y } = getCoordinates(e, canvas);
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e: any) => {
        if (!isDrawing) return;
        if (e.cancelable) e.preventDefault();
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        const { x, y } = getCoordinates(e, canvas);
        ctx.lineTo(x, y);
        ctx.strokeStyle = color;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.stroke();
    };

    return (
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-sm my-8 transition-colors">
            <div className="flex items-center justify-between mb-4 md:mb-6">
                <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                    <Palette className="text-fuchsia-500 shrink-0" size={20} strokeWidth={2.5}/> 
                    <span className="truncate">{String(block.title || "Let's Draw!")}</span>
                </h3>
                <button onClick={() => canvasRef.current?.getContext('2d')?.clearRect(0,0,800,400)} className="p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-full hover:bg-rose-100 dark:hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-200 dark:hover:border-rose-500/30 transition-all shrink-0 active:scale-95 shadow-sm">
                    <Eraser size={18} strokeWidth={2.5}/>
                </button>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 touch-none mb-6 select-none shadow-inner" style={{ touchAction: 'none' }}>
                <canvas 
                    ref={canvasRef} 
                    width={800} 
                    height={400} 
                    className="w-full h-[50vh] md:h-80 cursor-crosshair touch-none" 
                    onMouseDown={startDrawing} 
                    onMouseMove={draw} 
                    onMouseUp={() => setIsDrawing(false)} 
                    onMouseLeave={() => setIsDrawing(false)} 
                    onTouchStart={startDrawing} 
                    onTouchMove={draw} 
                    onTouchEnd={() => setIsDrawing(false)} 
                    style={{ touchAction: 'none' }}
                />
            </div>
            <div className="flex flex-wrap justify-center gap-3">
                {colors.map((c: string) => (<button key={c} onClick={() => setColor(c)} className={`w-9 h-9 md:w-10 md:h-10 rounded-full transition-all ${color === c ? 'scale-110 shadow-md ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900' : 'hover:scale-105 opacity-80 hover:opacity-100'}`} style={{ backgroundColor: c }} />))}
            </div>
        </div>
    );
};

const ImageBlockRenderer = ({ block }: any) => (
    <div className="py-8 animate-in fade-in">
      <div className="rounded-[2rem] overflow-hidden shadow-sm border border-slate-200/60 dark:border-slate-800/60">
        <img src={String(block.url || block.imageUrl || '')} alt="Lesson visual" className="w-full h-auto object-cover max-h-80" />
      </div>
      {block.caption && <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 text-center mt-3 px-4 uppercase tracking-wider">{String(block.caption)}</p>}
    </div>
);

const CalloutBlockRenderer = ({ block }: any) => (
    <div className="my-8 p-6 md:p-8 rounded-[2rem] bg-amber-50/80 dark:bg-amber-500/5 border border-amber-200/60 dark:border-amber-900/30 relative overflow-hidden group shadow-sm transition-colors">
      <Zap size={80} className="absolute -right-4 -top-4 text-amber-200/50 dark:text-amber-500/10 rotate-12 group-hover:scale-110 transition-transform duration-500" fill="currentColor" />
      <div className="relative z-10">
        <div className="flex items-center gap-2.5 mb-3.5">
          <div className="p-1.5 bg-amber-500 dark:bg-amber-500/20 text-white dark:text-amber-500 rounded-lg shadow-sm border border-amber-400 dark:border-amber-500/30"><Info size={14} strokeWidth={3} /></div>
          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-500 uppercase tracking-wider">{String(block.label || block.title || 'Spotlight')}</span>
        </div>
        <p className="text-base md:text-lg text-slate-800 dark:text-slate-200 font-semibold leading-relaxed italic pr-6 md:pr-12">"{String(block.content || block.text || '')}"</p>
      </div>
    </div>
);

const DialogueBlockRenderer = ({ block }: any) => (
    <div className="py-6 space-y-5">
      {(Array.isArray(block.lines) ? block.lines : []).map((line: any, j: number) => {
        const isRight = String(line.side) === 'right';
        return (
        <div key={j} className={`flex items-end gap-3 ${isRight ? 'flex-row-reverse' : ''}`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm border ${isRight ? 'bg-indigo-500 border-indigo-400' : 'bg-slate-400 dark:bg-slate-700 border-slate-300 dark:border-slate-600'}`}>
            {typeof line.speaker === 'string' && line.speaker.length > 0 ? line.speaker[0].toUpperCase() : '?'}
          </div>
          <div className={`max-w-[85%] p-4 md:p-5 rounded-[1.5rem] text-sm md:text-base font-medium leading-relaxed shadow-sm ${isRight ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-900 dark:text-indigo-100 border border-indigo-100 dark:border-indigo-500/20 rounded-br-sm' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-sm'}`}>
            {String(line.text || '')}
            {line.translation && <p className={`text-[11px] mt-2 italic opacity-80 font-semibold border-t pt-2 ${isRight ? 'border-indigo-200 dark:border-indigo-500/30' : 'border-slate-200 dark:border-slate-700'}`}>{String(line.translation)}</p>}
          </div>
        </div>
      )})}
    </div>
);

const DiscussionBlockRenderer = ({ block }: any) => (
    <div className="py-8 animate-in fade-in">
      <div className="bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-200/60 dark:border-indigo-500/20 rounded-[2rem] p-6 md:p-8 shadow-sm transition-colors">
        <div className="flex items-center gap-3 mb-6 md:mb-8">
          <div className="p-2.5 bg-indigo-500 dark:bg-indigo-500/20 text-white dark:text-indigo-400 border border-indigo-400 dark:border-indigo-500/30 rounded-xl shadow-sm shrink-0"><MessageCircle size={18} strokeWidth={2.5}/></div>
          <h3 className="text-lg md:text-xl font-bold text-indigo-900 dark:text-indigo-400 tracking-tight">{String(block.title || "Discussion")}</h3>
        </div>
        <div className="space-y-3">
          {(Array.isArray(block.questions) ? block.questions : []).map((q: any, qIdx: number) => (
            <div key={qIdx} className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800 flex gap-3.5 items-start transition-all hover:-translate-y-0.5 hover:shadow-md">
              <span className="text-indigo-400 dark:text-indigo-500 font-bold text-base leading-none mt-0.5 shrink-0">{qIdx + 1}</span>
              <p className="text-sm md:text-base text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{String(q || '')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
);

const GameBlockRenderer = ({ block }: any) => (
    <div className="py-8 animate-in fade-in slide-in-from-bottom-4 flex flex-col items-center">
      <div className="text-center mb-6">
        <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{String(block.title || "Vocabulary Battle")}</h3>
        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1.5">Game Active on Projector</p>
      </div>
      <div className="w-full h-64 bg-slate-950 rounded-[2rem] border border-slate-800 flex flex-col items-center justify-center text-white shadow-xl animate-pulse">
        <Gamepad2 size={40} strokeWidth={1.5} className="text-indigo-500 mb-4" />
        <p className="font-bold tracking-wider uppercase text-xs text-slate-400">Look at the Smartboard</p>
      </div>
    </div>
);

// ============================================================================
//  MAIN LESSON VIEW PLAYER
// ============================================================================

export default function LessonView({ lesson, onFinish, isInstructor = true }: LessonViewProps) {
  const [activePageIdx, setActivePageIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<any>(null); 

  // 🔥 STATE FOR THE LIVE AUDIO ROLEPLAY OVERLAY
  const [activeRoleplayPrompt, setActiveRoleplayPrompt] = useState<string | null>(null);

  const pages = useMemo(() => {
    if (!lesson || !Array.isArray(lesson.blocks)) return [];
    
    const grouped: any[] = [];
    let buffer: any[] = [];
    
    // 🔥 ALL VALID BLOCK TYPES REGISTERED HERE
    const allowedTypes = ['quiz', 'flashcard', 'scenario', 'fill-blank', 'discussion', 'game', 'code', 'formula', 'timeline', 'audio-story', 'image-hotspot', 'drag-drop', 'drawing', 'pronunciation', 'roleplay'];
    
    lesson.blocks.forEach((b: any) => {
      const type = String(b?.type || '');
      if (allowedTypes.indexOf(type) !== -1) {
        if (buffer.length > 0) grouped.push({ type: 'read', blocks: [...buffer] });
        grouped.push({ type: 'interact', blocks: [b] });
        buffer = [];
      } else { buffer.push(b); }
    });
    
    if (buffer.length > 0) grouped.push({ type: 'read', blocks: [...buffer] });
    return grouped;
  }, [lesson]);

  const syncToProjector = useCallback((newIdx: number) => {
    if (!isInstructor) return;
    const syncId = lesson.originalId || lesson.id;
    setDoc(doc(db, 'live_sessions', syncId), { activePageIdx: newIdx, liveBlockState: null, lastUpdate: Date.now() }, { merge: true }).catch(console.error);
  }, [lesson, isInstructor]);

  useEffect(() => {
    if (isInstructor && pages.length > 0) syncToProjector(0);
  }, [isInstructor, syncToProjector, pages.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isInstructor) return;
    const handleScroll = () => {
      if (scrollTimeout.current) return; 
      scrollTimeout.current = setTimeout(() => {
        const scrollPercent = container.scrollTop / (container.scrollHeight - container.clientHeight);
        const syncId = lesson.originalId || lesson.id;
        setDoc(doc(db, 'live_sessions', syncId), { scrollPercent: scrollPercent || 0, lastUpdate: Date.now() }, { merge: true }).catch(e => {});
        scrollTimeout.current = null;
      }, 50); 
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [lesson, isInstructor]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        const tag = (e.target as HTMLElement).tagName;
        if (['INPUT', 'TEXTAREA'].indexOf(tag) !== -1) return;
        
        // Disable keyboard nav if the user is inside the roleplay arena
        if (activeRoleplayPrompt) return;

        if (e.key === 'ArrowRight' || e.key === ' ') {
            e.preventDefault();
            if (activePageIdx < pages.length - 1) handleNext();
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            if (activePageIdx > 0) handlePrev();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (containerRef.current) containerRef.current.scrollBy({ top: window.innerHeight * 0.4, behavior: 'smooth' });
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (containerRef.current) containerRef.current.scrollBy({ top: -(window.innerHeight * 0.4), behavior: 'smooth' });
        }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePageIdx, pages.length, activeRoleplayPrompt]);

  const handlePrev = () => {
      const newIdx = Math.max(0, activePageIdx - 1);
      setActivePageIdx(newIdx);
      syncToProjector(newIdx);
      containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNext = () => {
      if (activePageIdx < pages.length - 1) {
          const newIdx = activePageIdx + 1;
          setActivePageIdx(newIdx);
          syncToProjector(newIdx); 
          containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
          onFinish();
      }
  };

  const renderBlock = (block: any, idx: number) => {
    if (!block) return null;
    const blockKey = `page_${activePageIdx}_block_${idx}`;
    const blockType = String(block.type || '');

    switch (blockType) {
      case 'image': return <ImageBlockRenderer block={block} key={blockKey} />;
      case 'callout': return <CalloutBlockRenderer block={block} key={blockKey} />;
      case 'dialogue': return <DialogueBlockRenderer block={block} key={blockKey} />;
      case 'vocab-list': return <VocabListBlockRenderer block={block} key={blockKey} />;
      case 'discussion': return <DiscussionBlockRenderer block={block} key={blockKey} />;
      case 'game': return <GameBlockRenderer block={block} key={blockKey} />;

      case 'drag-drop': return <div key={blockKey} className="animate-in slide-in-from-bottom-4 fade-in"><TapSortBlockRenderer block={block} /></div>;
      case 'code':
        return (
          <div key={blockKey} className="py-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-[#0D1117] rounded-[2rem] overflow-hidden shadow-lg border border-slate-800">
              <div className="bg-white/5 px-4 md:px-5 py-3 flex justify-between items-center border-b border-white/10"><div className="flex gap-2"><div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div><div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div><div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div></div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{String(block.language || 'Terminal')}</span></div>
              <div className="p-5 md:p-6 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"><pre className="text-emerald-400 font-mono text-sm md:text-sm leading-relaxed"><code>{String(block.content || '')}</code></pre></div>
            </div>
          </div>
        );
      case 'timeline':
        return (
           <div key={blockKey} className="py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {block.title && (<div className="flex items-center gap-3 mb-8"><div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-xl border border-amber-200 dark:border-amber-500/20"><BookOpen size={18} strokeWidth={2.5}/></div><h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{String(block.title)}</h3></div>)}
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-[2px] before:bg-slate-200 dark:before:bg-slate-800 before:rounded-full">
                 {(Array.isArray(block.events) ? block.events : []).map((event: any, evIdx: number) => (
                    <div key={evIdx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-[3px] border-white dark:border-slate-900 bg-indigo-600 text-white shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform group-hover:scale-110"><div className="w-2 h-2 bg-white rounded-full" /></div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-5 md:p-6 rounded-[1.5rem] bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group-hover:border-indigo-200 dark:group-hover:border-indigo-500/50">
                            <span className="font-bold text-indigo-500 text-[10px] tracking-wider uppercase mb-1.5 block">{String(event.date || '')}</span>
                            <h4 className="font-bold text-slate-900 dark:text-white text-lg leading-tight mb-2 tracking-tight">{String(event.title || '')}</h4>
                            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed">{String(event.description || '')}</p>
                        </div>
                    </div>
                 ))}
              </div>
           </div>
        );

      case 'read':
      case 'info':
      case 'content':
      case 'paragraph':
      case 'text': {
        const title = typeof block.title === 'string' ? block.title : (typeof block.content?.title === 'string' ? block.content.title : null);
        const textBody = typeof block.content === 'string' ? block.content : (typeof block.content?.text === 'string' ? block.content.text : (typeof block.text === 'string' ? block.text : ""));
        return (
          <div key={blockKey} className="py-6 animate-in fade-in slide-in-from-bottom-3 duration-700">
            {title && <span className="inline-block px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider mb-4 border border-indigo-100 dark:border-indigo-500/20">{String(title)}</span>}
            <div className="text-xl md:text-2xl font-semibold text-slate-800 dark:text-slate-200 leading-snug md:leading-snug tracking-tight whitespace-pre-wrap">{String(textBody)}</div>
          </div>
        );
      }
      
      case 'essay':
        return (
          <div key={blockKey} className="py-4 space-y-6 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-200/60 dark:border-slate-800 shadow-sm transition-colors">
                {block.title && (<div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100 dark:border-slate-800/60"><div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-100 dark:border-indigo-500/20 shrink-0"><BookOpen size={16} strokeWidth={2.5}/></div><h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{String(block.title)}</h3></div>)}
                <div className="text-slate-700 dark:text-slate-300 font-medium text-base leading-relaxed space-y-5">
                    {String(block.content || '').split('\n').map((p: string, j: number) => { if (!p.trim()) return null; return <p key={j}>{p}</p>; })}
                </div>
            </div>
          </div>
        );
      
      case 'quiz': return <div key={blockKey} className="animate-in slide-in-from-bottom-4 fade-in"><QuizBlockRenderer block={block} /></div>;
      case 'fill-blank': return <div key={blockKey} className="animate-in slide-in-from-bottom-4 fade-in"><FillBlankBlockRenderer block={block} /></div>;
      case 'scenario': return <div key={blockKey} className="animate-in slide-in-from-bottom-4 fade-in"><ScenarioBlockRenderer block={block} /></div>;
      case 'drawing': return <div key={blockKey} className="animate-in slide-in-from-bottom-4 fade-in"><DrawingBlockRenderer block={block} /></div>;
      case 'image-hotspot': return <div key={blockKey} className="animate-in slide-in-from-bottom-4 fade-in"><ImageHotspotBlockRenderer block={block} /></div>;
      case 'audio-story': return <div key={blockKey} className="animate-in slide-in-from-bottom-4 fade-in"><AudioStoryBlockRenderer block={block} /></div>;
      case 'pronunciation': return <div key={blockKey} className="animate-in slide-in-from-bottom-4 fade-in"><PronunciationLab block={block} /></div>;
      
      // 🔥 THE LIVE AUDIO ROLEPLAY LAUNCHER
      case 'roleplay': return <div key={blockKey} className="animate-in slide-in-from-bottom-4 fade-in"><LiveRoleplayBlockRenderer block={block} onLaunch={setActiveRoleplayPrompt} /></div>;

      default:
        return <div key={blockKey} className="p-6 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-300 dark:border-slate-700 text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider my-4">Unsupported Module: {blockType}</div>;
    }
  };

  if (!pages || pages.length === 0) {
      return (
          <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors">
              <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800 max-w-md mx-4">
                  <div className="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4"><AlertTriangle size={32} strokeWidth={2}/></div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Module Offline</h2>
                  <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">The data for this lesson appears to be corrupted or missing. Please contact your instructor.</p>
                  <button onClick={onFinish} className="mt-6 w-full py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-800 dark:hover:bg-indigo-500 active:scale-95 transition-all shadow-md">Return to Hub</button>
              </div>
          </div>
      );
  }

  const safePageIdx = Math.min(activePageIdx, pages.length - 1);
  const activePage = pages[safePageIdx];
  const progressPercent = ((safePageIdx + 1) / pages.length) * 100;

  return (
    <div className="flex flex-col min-h-[100dvh] h-[100dvh] bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans relative transition-colors duration-300">
      
      {/* THE LIVE AUDIO ARENA OVERLAY */}
      {activeRoleplayPrompt && (
          <LiveRoleplayArena 
              scenarioPrompt={activeRoleplayPrompt} 
              onClose={() => setActiveRoleplayPrompt(null)} 
          />
      )}

      <div className="px-5 md:px-8 pt-6 md:pt-8 pb-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 shrink-0 shadow-sm relative z-10">
        <div className="flex justify-between items-end">
          <div>
              <h1 className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1.5 truncate max-w-[200px] md:max-w-md">{String(lesson?.title || 'Active Session')}</h1>
              <p className="text-lg md:text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">Current Session</p>
          </div>
          {isInstructor && (
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-md border border-emerald-200 dark:border-emerald-500/20 shadow-sm">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Live</span>
            </div>
          )}
        </div>
      </div>
      
      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 md:px-10 py-6 pb-32 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth relative z-0">
        <div className="max-w-2xl mx-auto space-y-4">
          {activePage?.blocks?.map((block: any, i: number) => renderBlock(block, i))}
        </div>
      </div>
      
      <div className="px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-5 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-t border-slate-200/60 dark:border-slate-800/60 flex justify-between items-center fixed bottom-0 left-0 right-0 z-50 shadow-[0_-15px_30px_rgba(0,0,0,0.02)]">
        <div className="absolute top-0 left-0 h-1 bg-slate-200/50 dark:bg-slate-800 w-full overflow-hidden">
            <div className="h-full bg-indigo-500 dark:bg-indigo-400 transition-all duration-500 ease-out" style={{ width: `${progressPercent}%` }} />
        </div>
        <button onClick={handlePrev} className="p-3 md:p-3.5 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shadow-sm rounded-xl disabled:opacity-30 active:scale-95 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 hover:-translate-y-0.5" disabled={safePageIdx === 0}><ArrowLeft size={20} strokeWidth={2.5} /></button>
        <div className="text-center flex flex-col items-center">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">Progress</span>
            <span className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-200">{safePageIdx + 1} <span className="text-slate-300 dark:text-slate-700 mx-0.5">/</span> {pages.length}</span>
        </div>
        {safePageIdx < pages.length - 1 ? (
          <button onClick={handleNext} className="p-3 md:p-3.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-500/20 active:scale-95 transition-all hover:bg-indigo-500 hover:-translate-y-0.5"><ArrowRight size={20} strokeWidth={2.5} /></button>
        ) : (
          <button onClick={onFinish} className="px-6 py-2.5 md:px-8 md:py-3 bg-emerald-500 text-white font-bold rounded-xl shadow-md shadow-emerald-500/20 active:scale-95 transition-all text-xs tracking-wider hover:bg-emerald-400 hover:-translate-y-0.5">FINISH</button>
        )}
      </div>
    </div>
  );
}
