// src/components/LessonView.tsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  HelpCircle, CheckCircle2, X, Edit3, MessageSquare, 
  MessageCircle, ArrowLeft, ArrowRight, Info, Zap, BookOpen,
  Play, Square, Search, MousePointerClick, Palette, Eraser, Volume2, AlertTriangle, Gamepad2, Layers, Mic, RotateCcw
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
//  SHARED UI HELPERS
// ============================================================================

const SectionBadge = ({ icon: Icon, label, color = 'indigo' }: { icon: any; label: string; color?: 'indigo' | 'amber' | 'rose' | 'cyan' | 'fuchsia' }) => {
    const colorMap = {
        indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-500/20',
        amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-500/20',
        rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        fuchsia: 'bg-fuchsia-50 dark:bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-200/60 dark:border-fuchsia-500/20',
    };

    return (
        <div className="flex items-center gap-2.5 mb-4 sm:mb-6">
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border shrink-0 ${colorMap[color]}`}>
                <Icon size={16} strokeWidth={2.5} />
            </div>
            <h3 className="text-[11px] font-extrabold uppercase tracking-widest opacity-80">{label}</h3>
        </div>
    );
};

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
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm my-4 sm:my-6 relative overflow-hidden transition-colors">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
            <div className="text-indigo-600 dark:text-indigo-400">
                <SectionBadge icon={HelpCircle} label="Knowledge Check" color="indigo" />
            </div>
            
            <h4 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-5 sm:mb-6 leading-snug tracking-tight">
                {question}
            </h4>
            
            <div className="space-y-2.5 sm:space-y-3">
                {normalizedOptions.length === 0 ? (
                    <p className="text-slate-400 font-medium italic p-4 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                        No options provided.
                    </p>
                ) : (
                    normalizedOptions.map((opt: any, idx: number) => {
                        const isSelected = selectedId === opt.id;
                        const isOptCorrect = isSubmitted && opt.id === correctId;
                        const isOptWrong = isSubmitted && isSelected && opt.id !== correctId;

                        let btnStyle = "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 hover:border-indigo-300 dark:hover:border-indigo-500/50";
                        if (isSelected && !isSubmitted) btnStyle = "bg-indigo-600 border-indigo-600 text-white shadow-sm";
                        if (isOptCorrect) btnStyle = "bg-emerald-600 border-emerald-600 text-white shadow-sm";
                        if (isOptWrong) btnStyle = "bg-rose-600 border-rose-600 text-white shadow-sm";

                        return (
                            <button 
                                key={opt.id}
                                disabled={isSubmitted}
                                onClick={() => setSelectedId(opt.id)}
                                className={`w-full flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border font-semibold text-sm sm:text-base text-left transition-all active:scale-[0.99] disabled:active:scale-100 min-h-[54px] ${btnStyle}`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                                        isSelected || isOptCorrect || isOptWrong
                                            ? 'bg-white/20 text-white'
                                            : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                    }`}>
                                        {String.fromCharCode(65 + idx)}
                                    </span>
                                    <span className="break-words leading-snug">{opt.text}</span>
                                </div>
                                {isOptCorrect && <CheckCircle2 size={18} strokeWidth={2.5} className="text-white shrink-0" />}
                                {isOptWrong && <X size={18} strokeWidth={2.5} className="text-white shrink-0" />}
                            </button>
                        );
                    })
                )}
            </div>

            {!isSubmitted && selectedId !== null ? (
                <button
                    onClick={() => setIsSubmitted(true)}
                    className="mt-5 sm:mt-6 w-full py-3.5 sm:py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-800 dark:hover:bg-indigo-500 active:scale-[0.99] transition-all shadow-sm min-h-[48px]"
                >
                    Check Answer
                </button>
            ) : isSubmitted && (
                <div className={`mt-5 sm:mt-6 p-3.5 sm:p-4 rounded-xl flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center animate-in zoom-in-95 duration-200 border ${
                    isCorrect
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                        : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                }`}>
                    <span className="font-bold text-sm flex items-center gap-2">
                        {isCorrect ? <><CheckCircle2 size={18} strokeWidth={2.5}/> Correct!</> : <><X size={18} strokeWidth={2.5}/> Not quite right</>}
                    </span>
                    {!isCorrect && (
                        <button
                            onClick={() => { setIsSubmitted(false); setSelectedId(null); }}
                            className="w-full sm:w-auto px-4 py-2.5 bg-white dark:bg-slate-800 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm active:scale-95 transition-all text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 min-h-[40px]"
                        >
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
    const touchStartX = useRef<number | null>(null);

    const items = Array.isArray(block.items) ? block.items : [];
    if (items.length === 0) return null;

    const currentCard = items[index] || items[0];

    const handleNav = (dir: number) => {
        setIsFlipped(false);
        setTimeout(() => {
            setIndex((prev) => (prev + dir + items.length) % items.length);
        }, 120); 
    };

    const onTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const onTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return;
        const deltaX = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(deltaX) > 50) {
            handleNav(deltaX < 0 ? 1 : -1);
        }
        touchStartX.current = null;
    };

    return (
        <div className="py-4 sm:py-6 my-2 sm:my-4 animate-in fade-in slide-in-from-bottom-4 relative">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20 shrink-0">
                        <Layers size={16} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                        {String(block.title || 'Lexicon')}
                    </h3>
                </div>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 tabular-nums">
                    {index + 1} / {items.length}
                </span>
            </div>

            <div
                className="w-full select-none"
                style={{ perspective: '1000px' }}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
            >
                <div 
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="relative w-full h-64 sm:h-80 md:h-96 cursor-pointer transition-transform duration-500" 
                    style={{ transformStyle: 'preserve-3d', WebkitTransformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                >
                    {/* Front */}
                    <div 
                        className="absolute inset-0 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col items-center justify-center p-6 sm:p-8 text-center"
                        style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                    >
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest absolute top-5">
                            Term
                        </span>
                        <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-indigo-600 dark:text-indigo-400 leading-tight tracking-tight break-words max-w-full px-2">
                            {String(currentCard.term || '')}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider absolute bottom-5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                            Tap to Flip • Swipe for Next
                        </p>
                    </div>

                    {/* Back */}
                    <div 
                        className="absolute inset-0 bg-indigo-600 dark:bg-indigo-700 rounded-2xl sm:rounded-3xl shadow-md border border-indigo-500 flex flex-col items-center justify-center p-6 sm:p-8 text-white text-center" 
                        style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                        <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest absolute top-5">
                            Definition
                        </span>
                        <div className="overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full my-6 flex items-center justify-center">
                            <p className="text-base sm:text-lg md:text-xl font-semibold leading-relaxed">
                                {String(currentCard.definition || '')}
                            </p>
                        </div>
                        <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider absolute bottom-5">
                            Tap to Flip Back
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center mt-4 sm:mt-6 gap-4">
                <button
                    onClick={() => handleNav(-1)}
                    aria-label="Previous card"
                    className="p-3.5 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-300 active:scale-95 transition-all min-w-[48px] min-h-[48px] flex items-center justify-center"
                >
                    <ArrowLeft size={20} strokeWidth={2.5} />
                </button>
                
                {items.length <= 10 ? (
                    <div className="flex gap-1.5 flex-wrap justify-center">
                        {items.map((_: any, i: number) => (
                            <button
                                key={i}
                                onClick={() => { setIsFlipped(false); setIndex(i); }}
                                aria-label={`Go to card ${i + 1}`}
                                className={`h-2 rounded-full transition-all duration-300 ${i === index ? 'w-6 bg-indigo-500' : 'w-2 bg-slate-300 dark:bg-slate-700'}`}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 max-w-[160px] h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-indigo-500 transition-all duration-300"
                            style={{ width: `${((index + 1) / items.length) * 100}%` }}
                        />
                    </div>
                )}

                <button
                    onClick={() => handleNav(1)}
                    aria-label="Next card"
                    className="p-3.5 bg-indigo-600 text-white rounded-xl shadow-sm active:scale-95 transition-all hover:bg-indigo-500 min-w-[48px] min-h-[48px] flex items-center justify-center"
                >
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
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm my-4 sm:my-6 relative flex flex-col transition-colors">
            <div className="text-amber-600 dark:text-amber-500">
                <SectionBadge icon={Edit3} label="Vocabulary Drill" color="amber" />
            </div>

            <div className="sticky top-2 z-20 mb-5 sm:mb-6">
                <div className="bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col gap-2 max-h-[22vh]">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center shrink-0">
                        Word Bank (Tap to Place)
                    </span>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center items-start overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full">
                        {wordBank.length === 0 && !isChecked ? (
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 py-1">
                                <CheckCircle2 size={15} strokeWidth={2.5} /> All words placed
                            </span>
                        ) : (
                            wordBank.map((item) => (
                                <button 
                                    key={item.id}
                                    onClick={() => handleBankClick(item)}
                                    disabled={isChecked}
                                    className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-xl shadow-sm hover:border-indigo-400 active:scale-95 transition-all disabled:opacity-50 text-sm min-h-[38px]"
                                >
                                    {item.word}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="text-base sm:text-lg md:text-xl font-medium text-slate-800 dark:text-slate-200 leading-[2.4rem] sm:leading-[2.75rem] flex flex-wrap items-center gap-y-2 mb-4 tracking-tight">
                {textParts.map((part: string, i: number) => {
                    const isLast = i === textParts.length - 1;
                    const filledItem = filledBlanks[i];
                    
                    let blankStyle = "min-w-[76px] h-9 sm:h-10 bg-slate-100 dark:bg-slate-950 border-b-2 border-slate-300 dark:border-slate-700 mx-1 inline-flex items-center justify-center px-3 cursor-pointer transition-all rounded-lg";
                    if (filledItem) {
                        blankStyle = "min-w-[76px] h-9 sm:h-10 bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-300 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-300 font-bold rounded-xl mx-1 inline-flex items-center justify-center px-3.5 cursor-pointer shadow-sm active:scale-95 transition-all text-sm sm:text-base";
                    }
                    
                    if (isChecked && filledItem) {
                        const isCorrect = filledItem.word === correctAnswers[i];
                        blankStyle = `min-w-[76px] h-9 sm:h-10 font-bold rounded-xl mx-1 inline-flex items-center justify-center px-3.5 shadow-sm text-white text-sm sm:text-base ${
                            isCorrect ? 'bg-emerald-600 border-emerald-600' : 'bg-rose-600 border-rose-600'
                        }`;
                    }

                    return (
                        <React.Fragment key={`part_${i}`}>
                            <span>{String(part)}</span>
                            {!isLast && (
                                <button
                                    onClick={() => handleBlankClick(filledItem, i)}
                                    disabled={isChecked}
                                    className={blankStyle}
                                >
                                    {filledItem ? String(filledItem.word) : "___"}
                                </button>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {isComplete && !isChecked && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom-2">
                    <button
                        onClick={checkAnswers}
                        className="w-full py-3.5 sm:py-4 bg-emerald-600 text-white rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider hover:bg-emerald-500 shadow-sm active:scale-[0.99] transition-all min-h-[48px]"
                    >
                        Check Answers
                    </button>
                </div>
            )}

            {isChecked && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-center animate-in zoom-in-95">
                    {isEntirelyCorrect ? (
                        <div className="w-full py-3.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                            <CheckCircle2 size={18} strokeWidth={2.5}/> Perfectly Placed!
                        </div>
                    ) : (
                        <button
                            onClick={() => { 
                                setFilledBlanks(Array(correctAnswers.length).fill(null)); 
                                setWordBank(initialWordBank); 
                                setIsChecked(false); 
                            }}
                            className="w-full py-3.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 rounded-xl font-bold text-sm hover:bg-rose-100 active:scale-[0.99] transition-all flex items-center justify-center gap-2 min-h-[48px]"
                        >
                            <RotateCcw size={16} /> Try Again
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

const LiveRoleplayBlockRenderer = ({ block, onLaunch }: { block: any, onLaunch: (prompt: string) => void }) => {
    return (
        <div className="bg-slate-950 p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl shadow-lg my-6 text-white relative overflow-hidden border border-slate-800">
            <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-900 border border-cyan-500/30 rounded-2xl flex items-center justify-center text-cyan-400 mb-4 sm:mb-6">
                    <Mic size={22} strokeWidth={2.5} />
                </div>
                
                <h3 className="text-xl sm:text-2xl md:text-3xl font-black mb-3 leading-tight tracking-tight">
                    {String(block.title || "Live Simulation")}
                </h3>
                
                <div className="flex flex-wrap gap-2 items-center justify-center mb-5 sm:mb-6">
                    <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        AI: <span className="text-cyan-400">{block.metadata?.aiPersona || 'Partner'}</span>
                    </div>
                    <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        You: <span className="text-indigo-400">{block.metadata?.studentRole || 'Speaker'}</span>
                    </div>
                </div>

                <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed max-w-md mb-6 sm:mb-8">
                    Objective: <strong className="text-white">{block.metadata?.objective || 'Complete the scenario successfully.'}</strong>
                </p>

                <button 
                    onClick={() => onLaunch(block.prompt)}
                    className="w-full sm:w-auto px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 min-h-[48px]"
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
        <div className="bg-slate-900 p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-lg my-4 sm:my-6 text-white relative overflow-hidden border border-slate-800">
            <div className="relative z-10">
                <div className="text-rose-400">
                    <SectionBadge icon={MessageSquare} label="Interactive Branch" color="rose" />
                </div>
                <h4 className="text-lg sm:text-xl md:text-2xl font-bold mb-2.5 leading-tight tracking-tight">{title}</h4>
                <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed mb-6 italic border-l-2 border-rose-500/50 pl-3.5">
                    "{context}"
                </p>
                <div className="space-y-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">How do you respond?</p>
                    {options.map((opt: any, i: number) => {
                        const safeOpt = String(opt);
                        const isSelected = selectedOpt === safeOpt;
                        return (
                            <button 
                                key={i}
                                onClick={() => setSelectedOpt(safeOpt)}
                                className={`w-full p-3.5 sm:p-4 border rounded-xl text-left font-semibold text-sm transition-all active:scale-[0.99] min-h-[48px] ${
                                    isSelected
                                        ? 'bg-rose-600 border-rose-500 text-white shadow-sm'
                                        : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700 text-slate-200'
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

    const resetSort = useCallback(() => {
        setItems(normalizedItems);
        const init: Record<string, SortItem[]> = {};
        parsedCategories.forEach((c: string) => { init[c] = []; });
        setPlaced(init);
        setSelectedItem(null);
    }, [normalizedItems, parsedCategories]);

    useEffect(() => {
        resetSort();
    }, [resetSort]);

    const handleBucketClick = (category: string) => {
        if (selectedItem) {
            setPlaced(prev => ({ ...prev, [category]: [...(prev[category] || []), selectedItem] }));
            setItems(items.filter((i: SortItem) => i.id !== selectedItem.id));
            setSelectedItem(null);
        }
    };

    const handleReturnItem = (e: React.MouseEvent, category: string, item: SortItem) => {
        e.stopPropagation();
        setPlaced(prev => ({
            ...prev,
            [category]: (prev[category] || []).filter(i => i.id !== item.id)
        }));
        setItems(prev => [...prev, item]);
    };

    return (
        <div className="bg-amber-50/70 dark:bg-amber-500/5 p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-amber-200/80 dark:border-amber-900/30 my-4 sm:my-6 shadow-sm relative flex flex-col transition-colors">
            <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6">
                <div className="flex items-center gap-2.5">
                    <MousePointerClick className="text-amber-600 dark:text-amber-500 shrink-0" size={20} strokeWidth={2.5} />
                    <h3 className="text-base sm:text-xl font-bold text-amber-950 dark:text-amber-400 tracking-tight">
                        {String(block.title || 'Sort the Items')}
                    </h3>
                </div>
                {items.length < normalizedItems.length && (
                    <button
                        onClick={resetSort}
                        className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-100/80 dark:bg-amber-500/10 hover:bg-amber-200/60 transition-colors"
                    >
                        <RotateCcw size={13} /> Reset
                    </button>
                )}
            </div>
            
            <div className="sticky top-2 z-20 mb-5 sm:mb-6">
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-amber-200/60 dark:border-slate-700 shadow-sm flex flex-col gap-2 max-h-[24vh]">
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest text-center shrink-0">
                        {selectedItem ? 'Now tap a category below' : '1. Tap an item to select'}
                    </span>
                    <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full">
                        {items.length === 0 && (
                            <p className="text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider m-auto flex items-center gap-1.5 text-xs py-1">
                                <CheckCircle2 size={16} strokeWidth={2.5}/> All sorted! (Tap any item below to undo)
                            </p>
                        )}
                        {items.map((item: SortItem) => {
                            const isSelected = selectedItem?.id === item.id;
                            return (
                                <button 
                                    key={item.id} 
                                    onClick={() => setSelectedItem(isSelected ? null : item)} 
                                    className={`px-3.5 py-2 rounded-xl font-semibold text-sm transition-all shadow-sm border min-h-[38px] ${
                                        isSelected
                                            ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-500/30'
                                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 active:scale-95'
                                    }`}
                                >
                                    {item.emoji} {item.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {parsedCategories.map((cat: string) => (
                    <div
                        key={cat}
                        onClick={() => handleBucketClick(cat)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleBucketClick(cat); }}
                        className={`p-4 sm:p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 min-h-[120px] ${
                            selectedItem
                                ? 'border-indigo-400 border-dashed bg-indigo-50/40 dark:bg-indigo-500/10 cursor-pointer'
                                : 'border-amber-200/80 dark:border-amber-800/40 bg-white/60 dark:bg-slate-900/50'
                        }`}
                    >
                        <h4 className="font-bold text-amber-950 dark:text-amber-400 text-base sm:text-lg text-center leading-tight">
                            {cat}
                        </h4>
                        <div className="flex flex-wrap justify-center gap-1.5 w-full">
                            {placed[cat]?.map((item: SortItem) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={(e) => handleReturnItem(e, cat, item)}
                                    title="Tap to remove"
                                    className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm font-semibold shadow-sm flex items-center gap-1.5 text-slate-700 dark:text-slate-200 hover:border-rose-300 active:scale-95"
                                >
                                    <span>{item.emoji}</span>
                                    <span>{item.label}</span>
                                    <X size={12} className="text-slate-400 ml-0.5" />
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AudioStoryBlockRenderer = ({ block }: any) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const togglePlay = () => setIsPlaying(!isPlaying);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-slate-200/80 dark:border-slate-800 my-4 sm:my-6 transition-colors">
            <div className="relative">
                <img
                    src={String(block.imageUrl || 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?q=80&w=800&auto=format&fit=crop')}
                    alt="Story visual"
                    className="w-full h-48 sm:h-64 md:h-72 object-cover"
                />
                <button
                    onClick={togglePlay}
                    aria-label={isPlaying ? "Stop audio" : "Play audio"}
                    className={`absolute -bottom-6 right-5 sm:right-8 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 border-2 border-white dark:border-slate-900 ${
                        isPlaying ? 'bg-rose-500 text-white scale-105' : 'bg-indigo-600 text-white active:scale-95'
                    }`}
                >
                    {isPlaying ? <Square fill="currentColor" size={18} /> : <Play fill="currentColor" size={22} className="ml-0.5" />}
                </button>
            </div>
            <div className="p-5 sm:p-8 pt-8 sm:pt-10">
                <h3 className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Volume2 size={16} strokeWidth={2.5}/> Read Along
                </h3>
                <p className={`text-lg sm:text-2xl md:text-3xl font-bold leading-snug tracking-tight transition-colors duration-300 ${
                    isPlaying ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'
                }`}>
                    {String(block.text || "The legend says they looked for an eagle on a cactus...")}
                </p>
            </div>
        </div>
    );
};

const ImageHotspotBlockRenderer = ({ block }: any) => {
    const [activeSpot, setActiveSpot] = useState<number | null>(0);
    const hotspots = Array.isArray(block.hotspots) ? block.hotspots : [];
    const currentSpot = activeSpot !== null ? hotspots[activeSpot] : null;

    return (
        <div className="bg-slate-950 p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-lg my-4 sm:my-6 border border-slate-800">
            <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                    <Search className="text-cyan-400 shrink-0" size={18} strokeWidth={2.5} />
                    <h3 className="text-base sm:text-xl font-bold text-white tracking-tight">
                        {String(block.title || 'Explore the Image')}
                    </h3>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Tap Pins
                </span>
            </div>

            <div className="relative rounded-xl sm:rounded-2xl overflow-hidden border border-slate-800 bg-slate-900">
                <img
                    src={String(block.imageUrl || 'https://images.unsplash.com/photo-1565670119853-23910c2830f3?q=80&w=800&auto=format&fit=crop')}
                    className="w-full h-auto block"
                    alt="Interactive hotspot map"
                />
                {hotspots.map((spot: any, i: number) => {
                    const isSelected = activeSpot === i;
                    return (
                        <button
                            key={i}
                            onClick={() => setActiveSpot(isSelected ? null : i)}
                            aria-label={`Hotspot ${i + 1}: ${spot.title || ''}`}
                            className={`absolute w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-white flex items-center justify-center font-bold text-xs transition-transform z-10 ${
                                isSelected
                                    ? 'bg-cyan-500 text-slate-950 scale-110 ring-4 ring-cyan-400/40'
                                    : 'bg-rose-500 text-white shadow-md hover:scale-105'
                            }`}
                            style={{
                                top: `${Math.min(92, Math.max(8, Number(spot.y) || 0))}%`,
                                left: `${Math.min(92, Math.max(8, Number(spot.x) || 0))}%`,
                                transform: 'translate(-50%, -50%)'
                            }}
                        >
                            {i + 1}
                        </button>
                    );
                })}
            </div>

            {/* Mobile-safe docked inspector panel */}
            <div className="mt-4 bg-slate-900 border border-slate-800 rounded-xl p-4 min-h-[84px] flex flex-col justify-center">
                {currentSpot ? (
                    <div className="animate-in fade-in duration-200">
                        <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="text-sm sm:text-base font-bold text-cyan-400">
                                {activeSpot! + 1}. {String(currentSpot.title || 'Detail')}
                            </h4>
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-slate-300 leading-relaxed">
                            {String(currentSpot.description || '')}
                        </p>
                    </div>
                ) : (
                    <p className="text-xs font-semibold text-slate-500 text-center uppercase tracking-wider">
                        Tap any numbered pin on the image to inspect
                    </p>
                )}
            </div>
        </div>
    );
};

const DrawingBlockRenderer = ({ block }: any) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#ef4444'); 
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#0f172a'];

    // Properly scales CSS coordinates to internal 800x400 canvas resolution
    const getCoordinates = (e: any, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
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
        ctx.lineJoin = 'round';
        ctx.stroke();
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    };

    return (
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm my-4 sm:my-6 transition-colors">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Palette className="text-fuchsia-500 shrink-0" size={20} strokeWidth={2.5}/> 
                    <span className="truncate">{String(block.title || "Sketch Pad")}</span>
                </h3>
                <button
                    onClick={clearCanvas}
                    aria-label="Clear canvas"
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-all text-xs font-bold flex items-center gap-1.5 active:scale-95"
                >
                    <Eraser size={15} strokeWidth={2.5}/> Clear
                </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 touch-none mb-4 select-none">
                <canvas 
                    ref={canvasRef} 
                    width={800} 
                    height={450} 
                    className="w-full aspect-[16/9] cursor-crosshair touch-none block" 
                    onMouseDown={startDrawing} 
                    onMouseMove={draw} 
                    onMouseUp={() => setIsDrawing(false)} 
                    onMouseLeave={() => setIsDrawing(false)} 
                    onTouchStart={startDrawing} 
                    onTouchMove={draw} 
                    onTouchEnd={() => setIsDrawing(false)} 
                />
            </div>

            <div className="flex flex-wrap justify-center gap-3">
                {colors.map((c: string) => (
                    <button
                        key={c}
                        onClick={() => setColor(c)}
                        aria-label={`Select color ${c}`}
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all ${
                            color === c
                                ? 'scale-110 ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-900'
                                : 'opacity-75 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c }}
                    />
                ))}
            </div>
        </div>
    );
};

const ImageBlockRenderer = ({ block }: any) => (
    <div className="py-4 sm:py-6 animate-in fade-in">
      <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-slate-200/80 dark:border-slate-800">
        <img
            src={String(block.url || block.imageUrl || '')}
            alt={String(block.caption || 'Lesson visual')}
            className="w-full h-auto object-cover max-h-80"
        />
      </div>
      {block.caption && (
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 text-center mt-2.5 px-2">
            {String(block.caption)}
        </p>
      )}
    </div>
);

const CalloutBlockRenderer = ({ block }: any) => (
    <div className="my-4 sm:my-6 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-amber-50/90 dark:bg-amber-500/10 border border-amber-200/80 dark:border-amber-500/20 relative overflow-hidden shadow-sm transition-colors">
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="p-1.5 bg-amber-500 text-white rounded-lg">
            <Info size={14} strokeWidth={3} />
          </div>
          <span className="text-[11px] font-extrabold text-amber-800 dark:text-amber-400 uppercase tracking-widest">
            {String(block.label || block.title || 'Spotlight')}
          </span>
        </div>
        <p className="text-sm sm:text-base md:text-lg text-slate-800 dark:text-slate-200 font-semibold leading-relaxed">
          {String(block.content || block.text || '')}
        </p>
      </div>
    </div>
);

const DialogueBlockRenderer = ({ block }: any) => (
    <div className="py-4 sm:py-6 space-y-3.5 sm:space-y-4">
      {(Array.isArray(block.lines) ? block.lines : []).map((line: any, j: number) => {
        const isRight = String(line.side) === 'right';
        return (
        <div key={j} className={`flex items-end gap-2.5 sm:gap-3 ${isRight ? 'flex-row-reverse' : ''}`}>
          <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm ${
              isRight ? 'bg-indigo-600' : 'bg-slate-600 dark:bg-slate-700'
          }`}>
            {typeof line.speaker === 'string' && line.speaker.length > 0 ? line.speaker[0].toUpperCase() : '?'}
          </div>
          <div className={`max-w-[85%] sm:max-w-[80%] p-3.5 sm:p-4 rounded-2xl text-sm sm:text-base font-medium leading-relaxed shadow-sm ${
              isRight
                  ? 'bg-indigo-600 text-white rounded-br-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-xs'
          }`}>
            {typeof line.speaker === 'string' && (
                <span className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                    isRight ? 'text-indigo-200' : 'text-slate-400'
                }`}>
                    {line.speaker}
                </span>
            )}
            <p className="break-words">{String(line.text || '')}</p>
            {line.translation && (
                <p className={`text-xs mt-2 italic pt-2 border-t ${
                    isRight ? 'border-indigo-400/40 text-indigo-100' : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                    {String(line.translation)}
                </p>
            )}
          </div>
        </div>
      )})}
    </div>
);

const DiscussionBlockRenderer = ({ block }: any) => (
    <div className="py-4 sm:py-6 animate-in fade-in">
      <div className="bg-indigo-50/60 dark:bg-indigo-500/5 border border-indigo-200/60 dark:border-indigo-500/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm transition-colors">
        <div className="flex items-center gap-2.5 mb-4 sm:mb-6">
          <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-sm shrink-0">
            <MessageCircle size={18} strokeWidth={2.5}/>
          </div>
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-indigo-950 dark:text-indigo-300 tracking-tight">
            {String(block.title || "Discussion Prompts")}
          </h3>
        </div>
        <div className="space-y-2.5 sm:space-y-3">
          {(Array.isArray(block.questions) ? block.questions : []).map((q: any, qIdx: number) => (
            <div key={qIdx} className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/70 dark:border-slate-800 flex gap-3 items-start">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                {qIdx + 1}
              </span>
              <p className="text-sm sm:text-base text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                {String(q || '')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
);

const GameBlockRenderer = ({ block }: any) => (
    <div className="py-6 animate-in fade-in slide-in-from-bottom-4 flex flex-col items-center">
      <div className="text-center mb-4">
        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {String(block.title || "Vocabulary Battle")}
        </h3>
        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
            Game Active on Projector
        </p>
      </div>
      <div className="w-full h-52 sm:h-64 bg-slate-950 rounded-2xl sm:rounded-3xl border border-slate-800 flex flex-col items-center justify-center text-white shadow-lg">
        <Gamepad2 size={36} strokeWidth={1.75} className="text-indigo-400 mb-3 animate-bounce" />
        <p className="font-bold tracking-widest uppercase text-xs text-slate-400">Look at the Smartboard</p>
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
  const [activeRoleplayPrompt, setActiveRoleplayPrompt] = useState<string | null>(null);

  const pages = useMemo(() => {
    if (!lesson || !Array.isArray(lesson.blocks)) return [];
    
    const grouped: any[] = [];
    let buffer: any[] = [];
    
    const allowedTypes = [
        'quiz', 'flashcard', 'vocab-list', 'scenario', 'fill-blank',
        'discussion', 'game', 'code', 'formula', 'timeline',
        'audio-story', 'image-hotspot', 'drag-drop', 'drawing',
        'pronunciation', 'roleplay'
    ];
    
    lesson.blocks.forEach((b: any) => {
      const type = String(b?.type || '');
      if (allowedTypes.indexOf(type) !== -1) {
        if (buffer.length > 0) grouped.push({ type: 'read', blocks: [...buffer] });
        grouped.push({ type: 'interact', blocks: [b] });
        buffer = [];
      } else {
        buffer.push(b);
      }
    });
    
    if (buffer.length > 0) grouped.push({ type: 'read', blocks: [...buffer] });
    return grouped;
  }, [lesson]);

  const syncToProjector = useCallback((newIdx: number) => {
    if (!isInstructor) return;
    const syncId = lesson.originalId || lesson.id;
    if (!syncId) return;
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
        const maxScroll = container.scrollHeight - container.clientHeight;
        const scrollPercent = maxScroll > 0 ? container.scrollTop / maxScroll : 0;
        const syncId = lesson.originalId || lesson.id;
        if (syncId) {
            setDoc(doc(db, 'live_sessions', syncId), { scrollPercent: scrollPercent || 0, lastUpdate: Date.now() }, { merge: true }).catch(() => {});
        }
        scrollTimeout.current = null;
      }, 50); 
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [lesson, isInstructor]);

  const handlePrev = useCallback(() => {
      const newIdx = Math.max(0, activePageIdx - 1);
      setActivePageIdx(newIdx);
      syncToProjector(newIdx);
      containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activePageIdx, syncToProjector]);

  const handleNext = useCallback(() => {
      if (activePageIdx < pages.length - 1) {
          const newIdx = activePageIdx + 1;
          setActivePageIdx(newIdx);
          syncToProjector(newIdx); 
          containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
          onFinish();
      }
  }, [activePageIdx, pages.length, syncToProjector, onFinish]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        const tag = (e.target as HTMLElement).tagName;
        if (['INPUT', 'TEXTAREA'].indexOf(tag) !== -1) return;
        if (activeRoleplayPrompt) return;

        if (e.key === 'ArrowRight' || e.key === ' ') {
            e.preventDefault();
            if (activePageIdx < pages.length - 1) handleNext();
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            if (activePageIdx > 0) handlePrev();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            containerRef.current?.scrollBy({ top: window.innerHeight * 0.4, behavior: 'smooth' });
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            containerRef.current?.scrollBy({ top: -(window.innerHeight * 0.4), behavior: 'smooth' });
        }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePageIdx, pages.length, activeRoleplayPrompt, handleNext, handlePrev]);

  const renderBlock = (block: any, idx: number) => {
    if (!block) return null;
    const blockKey = `page_${activePageIdx}_block_${idx}`;
    const blockType = String(block.type || '');

    switch (blockType) {
      case 'image': return <ImageBlockRenderer block={block} key={blockKey} />;
      case 'callout': return <CalloutBlockRenderer block={block} key={blockKey} />;
      case 'dialogue': return <DialogueBlockRenderer block={block} key={blockKey} />;
      case 'flashcard':
      case 'vocab-list': return <VocabListBlockRenderer block={block} key={blockKey} />;
      case 'discussion': return <DiscussionBlockRenderer block={block} key={blockKey} />;
      case 'game': return <GameBlockRenderer block={block} key={blockKey} />;
      case 'drag-drop': return <TapSortBlockRenderer block={block} key={blockKey} />;

      case 'code':
        return (
          <div key={blockKey} className="py-4 sm:py-6 animate-in fade-in">
            <div className="bg-[#0D1117] rounded-2xl sm:rounded-3xl overflow-hidden shadow-md border border-slate-800">
              <div className="bg-white/5 px-4 py-2.5 flex justify-between items-center border-b border-white/10">
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {String(block.language || 'Code')}
                </span>
              </div>
              <div className="p-4 sm:p-6 overflow-x-auto">
                <pre className="text-emerald-400 font-mono text-xs sm:text-sm leading-relaxed">
                    <code>{String(block.content || '')}</code>
                </pre>
              </div>
            </div>
          </div>
        );

      case 'timeline':
        return (
           <div key={blockKey} className="py-4 sm:py-6 animate-in fade-in">
              {block.title && (
                <div className="flex items-center gap-2.5 mb-6">
                    <div className="p-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-xl border border-amber-200 dark:border-amber-500/20">
                        <BookOpen size={18} strokeWidth={2.5}/>
                    </div>
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                        {String(block.title)}
                    </h3>
                </div>
              )}
              <div className="space-y-4 sm:space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                 {(Array.isArray(block.events) ? block.events : []).map((event: any, evIdx: number) => (
                    <div key={evIdx} className="relative flex items-start md:items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white dark:border-slate-950 bg-indigo-600 text-white shadow-sm shrink-0 mt-1 md:mt-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                            <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                        <div className="w-[calc(100%-2.75rem)] md:w-[calc(50%-2.5rem)] p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                            <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-[10px] tracking-widest uppercase mb-1 block">
                                {String(event.date || '')}
                            </span>
                            <h4 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg leading-snug mb-1.5">
                                {String(event.title || '')}
                            </h4>
                            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-medium leading-relaxed">
                                {String(event.description || '')}
                            </p>
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
          <div key={blockKey} className="py-4 sm:py-6 animate-in fade-in">
            {title && (
                <span className="inline-block px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold uppercase tracking-widest mb-3 border border-indigo-200/60 dark:border-indigo-500/20">
                    {String(title)}
                </span>
            )}
            <div className="text-lg sm:text-xl md:text-2xl font-semibold text-slate-800 dark:text-slate-200 leading-relaxed sm:leading-snug tracking-tight whitespace-pre-wrap">
                {String(textBody)}
            </div>
          </div>
        );
      }
      
      case 'essay':
        return (
          <div key={blockKey} className="py-3 sm:py-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
                {block.title && (
                    <div className="flex items-center gap-2.5 mb-4 sm:mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 shrink-0">
                            <BookOpen size={16} strokeWidth={2.5}/>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                            {String(block.title)}
                        </h3>
                    </div>
                )}
                <div className="text-slate-700 dark:text-slate-300 font-medium text-sm sm:text-base leading-relaxed space-y-4">
                    {String(block.content || '').split('\n').map((p: string, j: number) => {
                        if (!p.trim()) return null;
                        return <p key={j}>{p}</p>;
                    })}
                </div>
            </div>
          </div>
        );
      
      case 'quiz': return <QuizBlockRenderer block={block} key={blockKey} />;
      case 'fill-blank': return <FillBlankBlockRenderer block={block} key={blockKey} />;
      case 'scenario': return <ScenarioBlockRenderer block={block} key={blockKey} />;
      case 'drawing': return <DrawingBlockRenderer block={block} key={blockKey} />;
      case 'image-hotspot': return <ImageHotspotBlockRenderer block={block} key={blockKey} />;
      case 'audio-story': return <AudioStoryBlockRenderer block={block} key={blockKey} />;
      case 'pronunciation': return <PronunciationLab block={block} key={blockKey} />;
      case 'roleplay': return <LiveRoleplayBlockRenderer block={block} onLaunch={setActiveRoleplayPrompt} key={blockKey} />;

      default:
        return (
            <div key={blockKey} className="p-5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500 font-bold uppercase tracking-wider my-4">
                Unsupported Module: {blockType}
            </div>
        );
    }
  };

  if (!pages || pages.length === 0) {
      return (
          <div className="h-[100dvh] flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
              <div className="text-center p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 max-w-md w-full">
                  <div className="w-14 h-14 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle size={28} strokeWidth={2}/>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2">Module Offline</h2>
                  <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                      The data for this lesson appears to be missing or empty.
                  </p>
                  <button
                      onClick={onFinish}
                      className="mt-6 w-full py-3.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider active:scale-95 transition-all min-h-[48px]"
                  >
                      Return to Hub
                  </button>
              </div>
          </div>
      );
  }

  const safePageIdx = Math.min(activePageIdx, pages.length - 1);
  const activePage = pages[safePageIdx];
  const progressPercent = ((safePageIdx + 1) / pages.length) * 100;

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans relative transition-colors duration-300">
      
      {/* LIVE AUDIO ARENA OVERLAY */}
      {activeRoleplayPrompt && (
          <LiveRoleplayArena 
              scenarioPrompt={activeRoleplayPrompt} 
              onClose={() => setActiveRoleplayPrompt(null)} 
          />
      )}

      {/* COMPACT MOBILE-FRIENDLY HEADER */}
      <header className="px-4 sm:px-6 md:px-8 pt-3 sm:pt-4 pb-3 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-800/80 shrink-0 z-20">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
              <button
                  onClick={onFinish}
                  aria-label="Exit Lesson"
                  className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-all shrink-0"
              >
                  <X size={18} strokeWidth={2.5} />
              </button>
              <div className="min-w-0">
                  <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block truncate">
                      {activePage?.type === 'interact' ? 'Interactive Drill' : 'Lesson Module'}
                  </span>
                  <h1 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">
                      {String(lesson?.title || 'Active Session')}
                  </h1>
              </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isInstructor && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Live</span>
              </div>
            )}
          </div>
        </div>
      </header>
      
      {/* SCROLLABLE LESSON CONTENT */}
      <main
        ref={containerRef}
        className="flex-1 overflow-y-auto px-3.5 sm:px-6 md:px-10 py-4 sm:py-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth relative z-0"
      >
        <div className="max-w-2xl mx-auto space-y-2 pb-6">
          {activePage?.blocks?.map((block: any, i: number) => renderBlock(block, i))}
        </div>
      </main>
      
      {/* THUMB-FRIENDLY FLEX FOOTER */}
      <footer className="px-4 sm:px-6 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800 shrink-0 z-20 relative">
        <div className="absolute top-0 left-0 h-1 bg-slate-200/70 dark:bg-slate-800 w-full overflow-hidden">
            <div
                className="h-full bg-indigo-600 dark:bg-indigo-400 transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
            />
        </div>

        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <button
            onClick={handlePrev}
            disabled={safePageIdx === 0}
            aria-label="Previous step"
            className="px-4 py-3 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl disabled:opacity-30 active:scale-95 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 min-h-[48px] min-w-[48px]"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="text-center flex flex-col items-center px-2">
              <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Step
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 tabular-nums">
                  {safePageIdx + 1} <span className="text-slate-300 dark:text-slate-700 mx-0.5">/</span> {pages.length}
              </span>
          </div>

          {safePageIdx < pages.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-5 sm:px-6 py-3 bg-indigo-600 text-white rounded-xl shadow-sm active:scale-95 transition-all hover:bg-indigo-500 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 min-h-[48px]"
            >
              <span>Next</span>
              <ArrowRight size={18} strokeWidth={2.5} />
            </button>
          ) : (
            <button
              onClick={onFinish}
              className="px-6 sm:px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-sm active:scale-95 transition-all text-xs uppercase tracking-wider hover:bg-emerald-500 flex items-center justify-center gap-1.5 min-h-[48px]"
            >
              <CheckCircle2 size={16} strokeWidth={2.5} />
              <span>Finish</span>
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
