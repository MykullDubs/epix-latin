// src/components/LessonView.tsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  HelpCircle, CheckCircle2, X, Edit3, MessageSquare, 
  MessageCircle, ArrowLeft, ArrowRight, Info, BookOpen,
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
//  TYPOGRAPHY-FIRST SECTION HEADER
// ============================================================================

const SectionHeader = ({
    icon: Icon,
    label,
    accent = 'indigo'
}: {
    icon: any;
    label: string;
    accent?: 'indigo' | 'amber' | 'rose' | 'cyan' | 'fuchsia' | 'emerald';
}) => {
    const accentMap = {
        indigo: 'bg-indigo-600 text-white',
        amber: 'bg-amber-500 text-black',
        rose: 'bg-rose-600 text-white',
        cyan: 'bg-cyan-400 text-black',
        fuchsia: 'bg-fuchsia-600 text-white',
        emerald: 'bg-emerald-600 text-white',
    };

    return (
        <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-zinc-900 dark:border-zinc-100">
            <div className={`w-7 h-7 flex items-center justify-center shrink-0 ${accentMap[accent]}`}>
                <Icon size={15} strokeWidth={2.75} />
            </div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100">
                {label}
            </h3>
        </div>
    );
};

// ============================================================================
//  INTERACTIVE RENDERERS (FLAT / HIGH-CONTRAST)
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
        <div className="bg-white dark:bg-black p-4 sm:p-6 md:p-8 border-2 border-zinc-900 dark:border-zinc-200 my-4 sm:my-6">
            <SectionHeader icon={HelpCircle} label="Knowledge Check" accent="indigo" />
            
            <h4 className="text-xl sm:text-2xl md:text-3xl font-black text-zinc-950 dark:text-white mb-6 leading-tight tracking-tight">
                {question}
            </h4>
            
            <div className="space-y-2.5">
                {normalizedOptions.length === 0 ? (
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs p-4 text-center border-2 border-dashed border-zinc-300 dark:border-zinc-800">
                        No options provided
                    </p>
                ) : (
                    normalizedOptions.map((opt: any, idx: number) => {
                        const isSelected = selectedId === opt.id;
                        const isOptCorrect = isSubmitted && opt.id === correctId;
                        const isOptWrong = isSubmitted && isSelected && opt.id !== correctId;

                        let rowStyle = "bg-white dark:bg-zinc-950 border-zinc-900 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900";
                        let indexStyle = "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border-zinc-900 dark:border-zinc-700";

                        if (isSelected && !isSubmitted) {
                            rowStyle = "bg-indigo-600 border-indigo-600 text-white";
                            indexStyle = "bg-indigo-800 text-white border-indigo-400";
                        }
                        if (isOptCorrect) {
                            rowStyle = "bg-emerald-600 border-emerald-600 text-white";
                            indexStyle = "bg-emerald-800 text-white border-emerald-400";
                        }
                        if (isOptWrong) {
                            rowStyle = "bg-rose-600 border-rose-600 text-white";
                            indexStyle = "bg-rose-800 text-white border-rose-400";
                        }

                        return (
                            <button 
                                key={opt.id}
                                disabled={isSubmitted}
                                onClick={() => setSelectedId(opt.id)}
                                className={`w-full flex items-stretch border-2 font-bold text-sm sm:text-base text-left transition-colors min-h-[56px] ${rowStyle}`}
                            >
                                <span className={`w-12 sm:w-14 border-r-2 text-xs sm:text-sm font-black flex items-center justify-center shrink-0 tabular-nums ${indexStyle}`}>
                                    {String.fromCharCode(65 + idx)}
                                </span>
                                <span className="flex-1 px-4 py-3.5 flex items-center justify-between gap-3 min-w-0">
                                    <span className="break-words leading-snug">{opt.text}</span>
                                    {isOptCorrect && <CheckCircle2 size={20} strokeWidth={2.75} className="text-white shrink-0" />}
                                    {isOptWrong && <X size={20} strokeWidth={2.75} className="text-white shrink-0" />}
                                </span>
                            </button>
                        );
                    })
                )}
            </div>

            {!isSubmitted && selectedId !== null ? (
                <button
                    onClick={() => setIsSubmitted(true)}
                    className="mt-6 w-full py-4 bg-zinc-950 dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 dark:hover:bg-indigo-500 dark:hover:text-white transition-colors min-h-[52px]"
                >
                    Verify Answer
                </button>
            ) : isSubmitted && (
                <div className={`mt-6 p-4 flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center border-2 ${
                    isCorrect
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-rose-600 text-white border-rose-600'
                }`}>
                    <span className="font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                        {isCorrect ? <><CheckCircle2 size={18} strokeWidth={2.75}/> Verified Correct</> : <><X size={18} strokeWidth={2.75}/> Incorrect Selection</>}
                    </span>
                    {!isCorrect && (
                        <button
                            onClick={() => { setIsSubmitted(false); setSelectedId(null); }}
                            className="w-full sm:w-auto px-5 py-2.5 bg-black text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-zinc-800 transition-colors min-h-[42px]"
                        >
                            Reset
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
        setIndex((prev) => (prev + dir + items.length) % items.length);
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
        <div className="my-4 sm:my-6 border-2 border-zinc-900 dark:border-zinc-200 bg-white dark:bg-black">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b-2 border-zinc-900 dark:border-zinc-200 bg-zinc-100 dark:bg-zinc-900">
                <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 bg-indigo-600 text-white flex items-center justify-center shrink-0">
                        <Layers size={14} strokeWidth={2.75} />
                    </div>
                    <h3 className="text-[11px] font-black text-zinc-950 dark:text-white uppercase tracking-[0.2em]">
                        {String(block.title || 'Lexicon')}
                    </h3>
                </div>
                <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 tabular-nums tracking-widest">
                    {String(index + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
                </span>
            </div>

            {/* Flat High-Contrast Tile (Instant State Toggle) */}
            <button
                type="button"
                onClick={() => setIsFlipped(!isFlipped)}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
                className={`w-full h-64 sm:h-80 p-6 sm:p-10 flex flex-col justify-between text-left transition-colors select-none ${
                    isFlipped
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-black text-zinc-950 dark:text-white'
                }`}
            >
                <div className="flex items-center justify-between w-full">
                    <span className={`text-[10px] font-black uppercase tracking-[0.25em] px-2 py-1 ${
                        isFlipped
                            ? 'bg-black text-white'
                            : 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black'
                    }`}>
                        {isFlipped ? 'Definition' : 'Term'}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${
                        isFlipped ? 'text-indigo-200' : 'text-zinc-400'
                    }`}>
                        Tap to Flip
                    </span>
                </div>

                <div className="my-auto overflow-y-auto max-h-44 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full">
                    {!isFlipped ? (
                        <h4 className="text-3xl sm:text-5xl font-black tracking-tighter leading-none break-words">
                            {String(currentCard.term || '')}
                        </h4>
                    ) : (
                        <p className="text-lg sm:text-2xl font-bold leading-snug tracking-tight">
                            {String(currentCard.definition || '')}
                        </p>
                    )}
                </div>

                <div className="w-full flex items-center gap-1">
                    {items.map((_: any, i: number) => (
                        <div
                            key={i}
                            className={`h-1.5 flex-1 transition-colors ${
                                i === index
                                    ? (isFlipped ? 'bg-white' : 'bg-indigo-600')
                                    : (isFlipped ? 'bg-indigo-400/40' : 'bg-zinc-200 dark:bg-zinc-800')
                            }`}
                        />
                    ))}
                </div>
            </button>

            {/* Contiguous Bottom Controls */}
            <div className="grid grid-cols-2 border-t-2 border-zinc-900 dark:border-zinc-200 divide-x-2 divide-zinc-900 dark:divide-zinc-200">
                <button
                    onClick={() => handleNav(-1)}
                    aria-label="Previous card"
                    className="py-3.5 px-4 bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 min-h-[48px] transition-colors"
                >
                    <ArrowLeft size={16} strokeWidth={2.75} /> Prev
                </button>
                <button
                    onClick={() => handleNav(1)}
                    aria-label="Next card"
                    className="py-3.5 px-4 bg-zinc-950 dark:bg-white text-white dark:text-black hover:bg-indigo-600 dark:hover:bg-indigo-500 dark:hover:text-white font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 min-h-[48px] transition-colors"
                >
                    Next <ArrowRight size={16} strokeWidth={2.75} />
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
        <div className="bg-white dark:bg-black p-4 sm:p-6 md:p-8 border-2 border-zinc-900 dark:border-zinc-200 my-4 sm:my-6 flex flex-col">
            <SectionHeader icon={Edit3} label="Syntax Drill" accent="amber" />

            {/* Sticky Solid Word Bank */}
            <div className="sticky top-0 z-20 mb-6">
                <div className="bg-zinc-100 dark:bg-zinc-900 p-3.5 sm:p-4 border-2 border-zinc-900 dark:border-zinc-200 flex flex-col gap-2.5 max-h-[24vh]">
                    <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em] shrink-0">
                        Word Bank // Tap to Insert
                    </span>
                    <div className="flex flex-wrap gap-2 items-start overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full">
                        {wordBank.length === 0 && !isChecked ? (
                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-1.5 py-1">
                                <CheckCircle2 size={15} strokeWidth={2.75} /> All Tokens Placed
                            </span>
                        ) : (
                            wordBank.map((item) => (
                                <button 
                                    key={item.id}
                                    onClick={() => handleBankClick(item)}
                                    disabled={isChecked}
                                    className="px-3.5 py-2 bg-white dark:bg-black border-2 border-zinc-900 dark:border-zinc-200 text-zinc-950 dark:text-white font-bold hover:bg-amber-400 hover:text-black dark:hover:bg-amber-400 dark:hover:text-black transition-colors disabled:opacity-40 text-sm min-h-[38px]"
                                >
                                    {item.word}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Passage with Sharp Inline Slots */}
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 leading-[2.6rem] sm:leading-[3rem] flex flex-wrap items-center gap-y-2.5 mb-4 tracking-tight">
                {textParts.map((part: string, i: number) => {
                    const isLast = i === textParts.length - 1;
                    const filledItem = filledBlanks[i];
                    
                    let blankStyle = "min-w-[88px] h-9 sm:h-10 bg-zinc-100 dark:bg-zinc-900 border-b-4 border-zinc-900 dark:border-zinc-100 mx-1.5 inline-flex items-center justify-center px-3 cursor-pointer text-xs uppercase tracking-widest text-zinc-400";
                    if (filledItem) {
                        blankStyle = "min-w-[88px] h-9 sm:h-10 bg-indigo-600 border-2 border-indigo-600 text-white font-black mx-1.5 inline-flex items-center justify-center px-3.5 cursor-pointer text-sm sm:text-base";
                    }
                    
                    if (isChecked && filledItem) {
                        const isCorrect = filledItem.word === correctAnswers[i];
                        blankStyle = `min-w-[88px] h-9 sm:h-10 font-black mx-1.5 inline-flex items-center justify-center px-3.5 text-white text-sm sm:text-base border-2 ${
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
                                    {filledItem ? String(filledItem.word) : "____"}
                                </button>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {isComplete && !isChecked && (
                <div className="mt-4 pt-4 border-t-2 border-zinc-200 dark:border-zinc-800">
                    <button
                        onClick={checkAnswers}
                        className="w-full py-4 bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-500 transition-colors min-h-[52px]"
                    >
                        Verify Syntax
                    </button>
                </div>
            )}

            {isChecked && (
                <div className="mt-4 pt-4 border-t-2 border-zinc-200 dark:border-zinc-800 flex justify-center">
                    {isEntirelyCorrect ? (
                        <div className="w-full py-4 bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                            <CheckCircle2 size={18} strokeWidth={2.75}/> Sequence Verified
                        </div>
                    ) : (
                        <button
                            onClick={() => { 
                                setFilledBlanks(Array(correctAnswers.length).fill(null)); 
                                setWordBank(initialWordBank); 
                                setIsChecked(false); 
                            }}
                            className="w-full py-4 bg-rose-600 text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-rose-500 transition-colors flex items-center justify-center gap-2 min-h-[52px]"
                        >
                            <RotateCcw size={16} strokeWidth={2.75} /> Reset Drill
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

const LiveRoleplayBlockRenderer = ({ block, onLaunch }: { block: any, onLaunch: (prompt: string) => void }) => {
    return (
        <div className="bg-black text-white p-5 sm:p-8 border-2 border-zinc-800 my-4 sm:my-6">
            <SectionHeader icon={Mic} label="Live Voice Simulation" accent="cyan" />

            <h3 className="text-2xl sm:text-4xl font-black mb-5 leading-none tracking-tighter uppercase">
                {String(block.title || "Live Simulation")}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 border-2 border-zinc-800 divide-y-2 sm:divide-y-0 sm:divide-x-2 divide-zinc-800 mb-6">
                <div className="p-3.5 bg-zinc-950">
                    <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">
                        Counterpart (AI)
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-cyan-400">
                        {block.metadata?.aiPersona || 'Partner'}
                    </span>
                </div>
                <div className="p-3.5 bg-zinc-950">
                    <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">
                        Assigned Role (You)
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-indigo-400">
                        {block.metadata?.studentRole || 'Speaker'}
                    </span>
                </div>
            </div>

            <div className="border-l-4 border-cyan-400 pl-4 py-1 mb-6">
                <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">
                    Mission Objective
                </span>
                <p className="text-base sm:text-lg font-bold text-white leading-snug">
                    {block.metadata?.objective || 'Complete the scenario successfully.'}
                </p>
            </div>

            <button 
                onClick={() => onLaunch(block.prompt)}
                className="w-full py-4 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs sm:text-sm uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2.5 min-h-[52px]"
            >
                <Mic size={18} strokeWidth={2.75} /> Launch Arena
            </button>
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
        <div className="bg-zinc-950 text-white p-4 sm:p-6 md:p-8 border-2 border-zinc-800 my-4 sm:my-6">
            <SectionHeader icon={MessageSquare} label="Decision Branch" accent="rose" />

            <h4 className="text-xl sm:text-2xl md:text-3xl font-black mb-4 leading-tight tracking-tight">
                {title}
            </h4>
            <p className="text-sm sm:text-base text-zinc-300 font-bold leading-relaxed mb-6 border-l-4 border-rose-600 pl-4 py-1">
                "{context}"
            </p>
            <div className="space-y-2.5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">
                    Select Response Vector
                </p>
                {options.map((opt: any, i: number) => {
                    const safeOpt = String(opt);
                    const isSelected = selectedOpt === safeOpt;
                    return (
                        <button 
                            key={i}
                            onClick={() => setSelectedOpt(safeOpt)}
                            className={`w-full p-4 border-2 text-left font-bold text-sm sm:text-base transition-colors min-h-[52px] flex items-center gap-3 ${
                                isSelected
                                    ? 'bg-rose-600 border-rose-600 text-white'
                                    : 'bg-black hover:bg-zinc-900 border-zinc-800 text-zinc-200'
                            }`}
                        >
                            <span className="text-xs font-black uppercase tabular-nums opacity-75">
                                0{i + 1}
                            </span>
                            <span>{safeOpt}</span>
                        </button>
                    );
                })}
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
            if (typeof item === 'string' || typeof item === 'number') return { id: `item_${idx}`, label: String(item), emoji: '' };
            return { 
                id: String(item?.id || `item_${idx}`), 
                label: String(item?.label || item?.text || ''), 
                emoji: String(item?.emoji || '')
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
        <div className="bg-white dark:bg-black p-4 sm:p-6 md:p-8 border-2 border-zinc-900 dark:border-zinc-200 my-4 sm:my-6 flex flex-col">
            <div className="flex items-center justify-between gap-2 mb-5 pb-3 border-b-2 border-zinc-900 dark:border-zinc-100">
                <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-amber-500 text-black flex items-center justify-center shrink-0">
                        <MousePointerClick size={15} strokeWidth={2.75} />
                    </div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100">
                        {String(block.title || 'Classification Matrix')}
                    </h3>
                </div>
                {items.length < normalizedItems.length && (
                    <button
                        onClick={resetSort}
                        className="text-[10px] font-black uppercase tracking-[0.2em] text-white bg-zinc-900 dark:bg-zinc-100 dark:text-black flex items-center gap-1.5 px-3 py-1.5"
                    >
                        <RotateCcw size={12} strokeWidth={2.75} /> Reset
                    </button>
                )}
            </div>
            
            <div className="sticky top-0 z-20 mb-6">
                <div className="bg-zinc-100 dark:bg-zinc-900 p-3.5 sm:p-4 border-2 border-zinc-900 dark:border-zinc-200 flex flex-col gap-2.5 max-h-[24vh]">
                    <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em] shrink-0">
                        {selectedItem ? 'Step 02 // Tap Target Category Below' : 'Step 01 // Select Item to Classify'}
                    </span>
                    <div className="flex flex-wrap gap-2 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full">
                        {items.length === 0 && (
                            <p className="text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-[0.2em] flex items-center gap-1.5 text-xs py-1">
                                <CheckCircle2 size={16} strokeWidth={2.75}/> All Items Classified (Tap Placed Item to Undo)
                            </p>
                        )}
                        {items.map((item: SortItem) => {
                            const isSelected = selectedItem?.id === item.id;
                            return (
                                <button 
                                    key={item.id} 
                                    onClick={() => setSelectedItem(isSelected ? null : item)} 
                                    className={`px-3.5 py-2 font-bold text-sm transition-colors border-2 min-h-[38px] ${
                                        isSelected
                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                            : 'bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 border-zinc-900 dark:border-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                                    }`}
                                >
                                    {item.emoji ? `${item.emoji} ` : ''}{item.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {parsedCategories.map((cat: string) => (
                    <div
                        key={cat}
                        onClick={() => handleBucketClick(cat)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleBucketClick(cat); }}
                        className={`border-2 transition-colors flex flex-col min-h-[140px] ${
                            selectedItem
                                ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 cursor-pointer'
                                : 'border-zinc-900 dark:border-zinc-200 bg-white dark:bg-black'
                        }`}
                    >
                        <div className="px-4 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black font-black text-xs uppercase tracking-[0.2em]">
                            {cat}
                        </div>
                        <div className="p-3.5 flex flex-wrap gap-2 flex-1 items-start content-start">
                            {placed[cat]?.map((item: SortItem) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={(e) => handleReturnItem(e, cat, item)}
                                    title="Tap to remove"
                                    className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 text-xs sm:text-sm font-bold flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-colors"
                                >
                                    {item.emoji && <span>{item.emoji}</span>}
                                    <span>{item.label}</span>
                                    <X size={13} strokeWidth={2.75} className="ml-0.5" />
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
        <div className="bg-white dark:bg-black border-2 border-zinc-900 dark:border-zinc-200 my-4 sm:my-6">
            <div className="relative border-b-2 border-zinc-900 dark:border-zinc-200">
                <img
                    src={String(block.imageUrl || 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?q=80&w=800&auto=format&fit=crop')}
                    alt="Story visual"
                    className="w-full h-52 sm:h-64 md:h-72 object-cover block"
                />
                <button
                    onClick={togglePlay}
                    aria-label={isPlaying ? "Stop audio" : "Play audio"}
                    className={`absolute bottom-0 right-0 w-14 h-14 flex items-center justify-center transition-colors border-t-2 border-l-2 border-zinc-900 dark:border-zinc-200 ${
                        isPlaying ? 'bg-rose-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-500'
                    }`}
                >
                    {isPlaying ? <Square fill="currentColor" size={20} /> : <Play fill="currentColor" size={22} className="ml-0.5" />}
                </button>
            </div>
            <div className="p-5 sm:p-8">
                <div className="flex items-center gap-2 mb-3">
                    <Volume2 size={16} strokeWidth={2.75} className="text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">
                        Audio Transcript
                    </h3>
                </div>
                <p className={`text-xl sm:text-2xl md:text-3xl font-black leading-tight tracking-tight transition-colors ${
                    isPlaying ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-950 dark:text-white'
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
        <div className="bg-black p-4 sm:p-6 md:p-8 border-2 border-zinc-800 my-4 sm:my-6 text-white">
            <SectionHeader icon={Search} label={String(block.title || 'Visual Inspection')} accent="cyan" />

            <div className="relative border-2 border-zinc-800 bg-zinc-950">
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
                            className={`absolute w-10 h-10 sm:w-11 sm:h-11 border-2 flex items-center justify-center font-black text-xs tabular-nums transition-colors z-10 ${
                                isSelected
                                    ? 'bg-cyan-400 text-black border-black'
                                    : 'bg-rose-600 text-white border-white hover:bg-rose-500'
                            }`}
                            style={{
                                top: `${Math.min(92, Math.max(8, Number(spot.y) || 0))}%`,
                                left: `${Math.min(92, Math.max(8, Number(spot.x) || 0))}%`,
                                transform: 'translate(-50%, -50%)'
                            }}
                        >
                            {String(i + 1).padStart(2, '0')}
                        </button>
                    );
                })}
            </div>

            {/* Docked Flat Readout Panel */}
            <div className="border-x-2 border-b-2 border-zinc-800 bg-zinc-950 p-4 min-h-[88px] flex flex-col justify-center">
                {currentSpot ? (
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 block mb-1 tabular-nums">
                            Pin {String(activeSpot! + 1).padStart(2, '0')} // {String(currentSpot.title || 'Detail')}
                        </span>
                        <p className="text-xs sm:text-sm font-bold text-zinc-200 leading-relaxed">
                            {String(currentSpot.description || '')}
                        </p>
                    </div>
                ) : (
                    <p className="text-xs font-black text-zinc-500 text-center uppercase tracking-[0.2em]">
                        Select a Numbered Marker Above
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
    const colors = ['#ef4444', '#2563eb', '#10b981', '#f59e0b', '#7c3aed', '#09090b'];

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
        ctx.lineCap = 'square';
        ctx.lineJoin = 'miter';
        ctx.stroke();
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    };

    return (
        <div className="bg-white dark:bg-black p-4 sm:p-6 md:p-8 border-2 border-zinc-900 dark:border-zinc-200 my-4 sm:my-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-zinc-900 dark:border-zinc-200">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-fuchsia-600 text-white flex items-center justify-center shrink-0">
                        <Palette size={15} strokeWidth={2.75}/> 
                    </div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-950 dark:text-white truncate">
                        {String(block.title || "Freehand Canvas")}
                    </h3>
                </div>
                <button
                    onClick={clearCanvas}
                    aria-label="Clear canvas"
                    className="px-3.5 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black hover:bg-rose-600 dark:hover:bg-rose-600 dark:hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5"
                >
                    <Eraser size={14} strokeWidth={2.75}/> Clear
                </button>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-900 dark:border-zinc-200 touch-none mb-4 select-none">
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

            <div className="flex flex-wrap gap-2">
                {colors.map((c: string) => (
                    <button
                        key={c}
                        onClick={() => setColor(c)}
                        aria-label={`Select color ${c}`}
                        className={`w-10 h-10 border-2 transition-transform ${
                            color === c
                                ? 'border-zinc-950 dark:border-white scale-110'
                                : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c }}
                    />
                ))}
            </div>
        </div>
    );
};

const ImageBlockRenderer = ({ block }: any) => (
    <div className="my-4 sm:my-6 border-2 border-zinc-900 dark:border-zinc-200 bg-white dark:bg-black">
      <img
          src={String(block.url || block.imageUrl || '')}
          alt={String(block.caption || 'Lesson visual')}
          className="w-full h-auto object-cover max-h-80 block"
      />
      {block.caption && (
        <p className="text-[11px] font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-[0.15em] px-4 py-3 border-t-2 border-zinc-900 dark:border-zinc-200 bg-zinc-100 dark:bg-zinc-900">
            {String(block.caption)}
        </p>
      )}
    </div>
);

const CalloutBlockRenderer = ({ block }: any) => (
    <div className="my-4 sm:my-6 p-5 sm:p-6 bg-amber-400 text-black border-2 border-black">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 bg-black text-amber-400 flex items-center justify-center">
          <Info size={14} strokeWidth={3} />
        </div>
        <span className="text-[11px] font-black uppercase tracking-[0.2em]">
          {String(block.label || block.title || 'Key Directive')}
        </span>
      </div>
      <p className="text-base sm:text-lg md:text-xl font-black leading-snug tracking-tight">
        {String(block.content || block.text || '')}
      </p>
    </div>
);

const DialogueBlockRenderer = ({ block }: any) => (
    <div className="py-4 sm:py-6 space-y-3">
      {(Array.isArray(block.lines) ? block.lines : []).map((line: any, j: number) => {
        const isRight = String(line.side) === 'right';
        return (
        <div key={j} className={`flex items-stretch gap-2.5 ${isRight ? 'flex-row-reverse' : ''}`}>
          <div className={`w-10 sm:w-11 flex items-center justify-center text-xs font-black text-white shrink-0 border-2 border-zinc-900 dark:border-zinc-200 ${
              isRight ? 'bg-indigo-600' : 'bg-zinc-900 dark:bg-zinc-800'
          }`}>
            {typeof line.speaker === 'string' && line.speaker.length > 0 ? line.speaker[0].toUpperCase() : '?'}
          </div>
          <div className={`max-w-[85%] sm:max-w-[80%] p-3.5 sm:p-4 text-sm sm:text-base font-bold leading-snug border-2 ${
              isRight
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white dark:bg-zinc-950 border-zinc-900 dark:border-zinc-200 text-zinc-900 dark:text-zinc-100'
          }`}>
            {typeof line.speaker === 'string' && (
                <span className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${
                    isRight ? 'text-indigo-200' : 'text-zinc-500 dark:text-zinc-400'
                }`}>
                    {line.speaker}
                </span>
            )}
            <p className="break-words">{String(line.text || '')}</p>
            {line.translation && (
                <p className={`text-xs mt-2 pt-2 border-t-2 font-semibold ${
                    isRight ? 'border-indigo-400 text-indigo-100' : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400'
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
    <div className="my-4 sm:my-6 bg-white dark:bg-black border-2 border-zinc-900 dark:border-zinc-200 p-4 sm:p-6 md:p-8">
      <SectionHeader icon={MessageCircle} label={String(block.title || "Discussion Prompts")} accent="indigo" />
      <div className="divide-y-2 divide-zinc-900 dark:divide-zinc-800 border-2 border-zinc-900 dark:border-zinc-800">
        {(Array.isArray(block.questions) ? block.questions : []).map((q: any, qIdx: number) => (
          <div key={qIdx} className="bg-white dark:bg-zinc-950 flex items-stretch">
            <span className="w-12 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black font-black text-xs flex items-center justify-center shrink-0 tabular-nums">
              {String(qIdx + 1).padStart(2, '0')}
            </span>
            <p className="p-4 text-sm sm:text-base text-zinc-900 dark:text-zinc-100 font-bold leading-snug">
              {String(q || '')}
            </p>
          </div>
        ))}
      </div>
    </div>
);

const GameBlockRenderer = ({ block }: any) => (
    <div className="my-6 border-2 border-zinc-900 dark:border-zinc-200 bg-black text-white p-6 sm:p-10 flex flex-col items-center text-center">
      <Gamepad2 size={40} strokeWidth={2} className="text-indigo-500 mb-3" />
      <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter">
          {String(block.title || "Vocabulary Battle")}
      </h3>
      <p className="text-[10px] font-black text-black bg-amber-400 px-3 py-1 uppercase tracking-[0.2em] mt-3">
          Active on Classroom Projector
      </p>
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
          <div key={blockKey} className="my-4 sm:my-6 border-2 border-zinc-900 dark:border-zinc-200 bg-black">
            <div className="bg-zinc-900 px-4 py-2.5 flex justify-between items-center border-b-2 border-zinc-800">
              <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                  {String(block.language || 'Source')}
              </span>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  UTF-8
              </span>
            </div>
            <div className="p-4 sm:p-6 overflow-x-auto">
              <pre className="text-emerald-400 font-mono text-xs sm:text-sm leading-relaxed">
                  <code>{String(block.content || '')}</code>
              </pre>
            </div>
          </div>
        );

      case 'timeline':
        return (
           <div key={blockKey} className="my-4 sm:my-6 bg-white dark:bg-black border-2 border-zinc-900 dark:border-zinc-200 p-4 sm:p-6 md:p-8">
              <SectionHeader icon={BookOpen} label={String(block.title || 'Chronology')} accent="amber" />
              <div className="border-l-4 border-zinc-900 dark:border-zinc-100 ml-2 pl-5 space-y-6">
                 {(Array.isArray(block.events) ? block.events : []).map((event: any, evIdx: number) => (
                    <div key={evIdx} className="relative">
                        <div className="absolute -left-[29px] top-1 w-3.5 h-3.5 bg-indigo-600 border-2 border-white dark:border-black" />
                        <span className="font-black text-indigo-600 dark:text-indigo-400 text-[10px] tracking-[0.2em] uppercase block mb-1 tabular-nums">
                            {String(event.date || '')}
                        </span>
                        <h4 className="font-black text-zinc-950 dark:text-white text-lg sm:text-xl leading-tight mb-1 tracking-tight">
                            {String(event.title || '')}
                        </h4>
                        <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm font-bold leading-relaxed">
                            {String(event.description || '')}
                        </p>
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
          <div key={blockKey} className="py-4 sm:py-6">
            {title && (
                <span className="inline-block px-2.5 py-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black text-[10px] font-black uppercase tracking-[0.2em] mb-3">
                    {String(title)}
                </span>
            )}
            <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-zinc-950 dark:text-zinc-100 leading-snug tracking-tight whitespace-pre-wrap">
                {String(textBody)}
            </div>
          </div>
        );
      }
      
      case 'essay':
        return (
          <div key={blockKey} className="my-4 sm:my-6 bg-white dark:bg-black p-4 sm:p-6 md:p-8 border-2 border-zinc-900 dark:border-zinc-200">
            {block.title && (
                <SectionHeader icon={BookOpen} label={String(block.title)} accent="indigo" />
            )}
            <div className="text-zinc-800 dark:text-zinc-200 font-bold text-base sm:text-lg leading-relaxed space-y-4">
                {String(block.content || '').split('\n').map((p: string, j: number) => {
                    if (!p.trim()) return null;
                    return <p key={j}>{p}</p>;
                })}
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
            <div key={blockKey} className="p-5 bg-zinc-100 dark:bg-zinc-900 border-2 border-dashed border-zinc-400 dark:border-zinc-700 text-center text-xs text-zinc-500 font-black uppercase tracking-[0.2em] my-4">
                Unsupported Module // {blockType}
            </div>
        );
    }
  };

  if (!pages || pages.length === 0) {
      return (
          <div className="h-[100dvh] flex items-center justify-center bg-white dark:bg-black p-4">
              <div className="p-6 sm:p-8 bg-white dark:bg-black border-2 border-zinc-900 dark:border-zinc-100 max-w-md w-full">
                  <div className="w-12 h-12 bg-rose-600 text-white flex items-center justify-center mb-4">
                      <AlertTriangle size={24} strokeWidth={2.5}/>
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-950 dark:text-white mb-2">
                      Module Offline
                  </h2>
                  <p className="text-zinc-600 dark:text-zinc-400 font-bold text-sm">
                      The payload for this lesson is empty or corrupted.
                  </p>
                  <button
                      onClick={onFinish}
                      className="mt-6 w-full py-4 bg-zinc-950 dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-[0.2em] min-h-[48px]"
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
    <div className="flex flex-col h-[100dvh] bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-white overflow-hidden font-sans relative">
      
      {/* LIVE AUDIO ARENA OVERLAY */}
      {activeRoleplayPrompt && (
          <LiveRoleplayArena 
              scenarioPrompt={activeRoleplayPrompt} 
              onClose={() => setActiveRoleplayPrompt(null)} 
          />
      )}

      {/* HIGH-CONTRAST ARCHITECTURAL HEADER */}
      <header className="bg-white dark:bg-black border-b-2 border-zinc-900 dark:border-zinc-200 shrink-0 z-20">
        <div className="max-w-2xl mx-auto flex items-stretch justify-between min-h-[56px]">
          <div className="flex items-stretch min-w-0 flex-1">
              <button
                  onClick={onFinish}
                  aria-label="Exit Lesson"
                  className="w-14 bg-zinc-950 dark:bg-white text-white dark:text-black hover:bg-rose-600 dark:hover:bg-rose-600 dark:hover:text-white flex items-center justify-center transition-colors shrink-0"
              >
                  <X size={20} strokeWidth={2.75} />
              </button>
              <div className="px-4 py-2 flex flex-col justify-center min-w-0">
                  <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.25em] block truncate">
                      {activePage?.type === 'interact' ? 'Interactive Drill' : 'Lesson Unit'}
                  </span>
                  <h1 className="text-sm sm:text-base font-black text-zinc-950 dark:text-white tracking-tight uppercase truncate">
                      {String(lesson?.title || 'Active Session')}
                  </h1>
              </div>
          </div>

          {isInstructor && (
            <div className="px-3.5 border-l-2 border-zinc-900 dark:border-zinc-200 bg-emerald-500 text-black flex items-center gap-2 shrink-0">
                <span className="w-2 h-2 bg-black animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Live</span>
            </div>
          )}
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
      
      {/* CONTIGUOUS FLAT GRID FOOTER */}
      <footer className="bg-white dark:bg-black border-t-2 border-zinc-900 dark:border-zinc-200 pb-[env(safe-area-inset-bottom)] shrink-0 z-20 relative">
        {/* Sharp Progress Strip */}
        <div className="h-1.5 bg-zinc-200 dark:bg-zinc-800 w-full overflow-hidden">
            <div
                className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-200"
                style={{ width: `${progressPercent}%` }}
            />
        </div>

        <div className="max-w-2xl mx-auto grid grid-cols-3 divide-x-2 divide-zinc-900 dark:divide-zinc-200 min-h-[56px]">
          <button
            onClick={handlePrev}
            disabled={safePageIdx === 0}
            aria-label="Previous step"
            className="px-4 py-3 bg-white dark:bg-black text-zinc-950 dark:text-white disabled:opacity-25 hover:bg-zinc-100 dark:hover:bg-zinc-900 font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft size={16} strokeWidth={2.75} />
            <span>Back</span>
          </button>

          <div className="flex flex-col items-center justify-center px-2 bg-zinc-100 dark:bg-zinc-900">
              <span className="text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.25em]">
                  Step
              </span>
              <span className="text-xs sm:text-sm font-black text-zinc-950 dark:text-white tabular-nums tracking-widest">
                  {String(safePageIdx + 1).padStart(2, '0')} / {String(pages.length).padStart(2, '0')}
              </span>
          </div>

          {safePageIdx < pages.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-4 py-3 bg-indigo-600 text-white hover:bg-indigo-500 font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-colors"
            >
              <span>Next</span>
              <ArrowRight size={16} strokeWidth={2.75} />
            </button>
          ) : (
            <button
              onClick={onFinish}
              className="px-4 py-3 bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-500 flex items-center justify-center gap-2 transition-colors"
            >
              <CheckCircle2 size={16} strokeWidth={2.75} />
              <span>Finish</span>
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
