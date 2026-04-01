// src/components/LessonView.tsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  HelpCircle, CheckCircle2, X, Edit3, MessageSquare, 
  MessageCircle, ArrowLeft, ArrowRight, Info, Zap, BookOpen,
  Play, Square, Search, MousePointerClick, Palette, Eraser, Volume2, AlertTriangle
} from 'lucide-react';

export interface LessonViewProps {
    lessonId?: string | null;
    lessons?: any[];
    lesson: any;
    onFinish: () => void;
    isInstructor?: boolean;
}

// ============================================================================
//  INTERACTIVE RENDERERS (Mobile-Safe & Armored)
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
             const found = normalizedOptions.find((o:any) => o.text === String(data.correctAnswer));
             correctId = found?.id;
         }
    }
    if (correctId === undefined && normalizedOptions.length > 0) correctId = normalizedOptions[0].id;
    const isCorrect = selectedId === correctId;

    return (
        <div className="bg-white p-5 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm my-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500" />
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner shrink-0">
                    <HelpCircle size={20} strokeWidth={2.5} />
                </div>
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest">Knowledge Check</h3>
            </div>
            
            <h4 className="text-lg md:text-xl font-black text-slate-800 mb-6 leading-snug">{question}</h4>
            
            <div className="space-y-3">
                {normalizedOptions.length === 0 ? (
                    <p className="text-slate-400 font-medium italic p-4 text-center border-2 border-dashed rounded-2xl">No options provided.</p>
                ) : (
                    normalizedOptions.map((opt: any) => {
                        const isSelected = selectedId === opt.id;
                        const isOptCorrect = isSubmitted && opt.id === correctId;
                        const isOptWrong = isSubmitted && isSelected && opt.id !== correctId;

                        let btnStyle = "bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50";
                        if (isSelected && !isSubmitted) btnStyle = "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200";
                        if (isOptCorrect) btnStyle = "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200";
                        if (isOptWrong) btnStyle = "bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-200";

                        return (
                            <button 
                                key={opt.id} disabled={isSubmitted} onClick={() => setSelectedId(opt.id)}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 font-bold text-left transition-all active:scale-[0.98] disabled:active:scale-100 min-h-[60px] ${btnStyle}`}
                            >
                                <span className="pr-4">{opt.text}</span>
                                {isOptCorrect && <CheckCircle2 size={20} className="text-white shrink-0" />}
                                {isOptWrong && <X size={20} className="text-white shrink-0" />}
                            </button>
                        );
                    })
                )}
            </div>

            {!isSubmitted && selectedId !== null ? (
                <button onClick={() => setIsSubmitted(true)} className="mt-6 w-full py-4 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 active:scale-95 transition-all shadow-xl">
                    Check Answer
                </button>
            ) : isSubmitted && (
                <div className={`mt-6 p-4 rounded-xl flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center animate-in zoom-in ${isCorrect ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                    <span className="font-bold flex items-center gap-2">
                        {isCorrect ? <><CheckCircle2 size={20}/> Correct!</> : <><X size={20}/> Incorrect</>}
                    </span>
                    {!isCorrect && (
                        <button onClick={() => { setIsSubmitted(false); setSelectedId(null); }} className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-white rounded-lg text-xs font-black uppercase tracking-widest shadow-sm hover:shadow active:scale-95 transition-all text-rose-600 border border-rose-200">
                            Try Again
                        </button>
                    )}
                </div>
            )}
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

    const checkAnswers = () => {
        setIsChecked(true); 
    };

    const isEntirelyCorrect = isChecked && filledBlanks.every((item, i) => item?.word === correctAnswers[i]);

    return (
        <div className="bg-white p-5 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm my-6 relative flex flex-col">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shadow-inner shrink-0">
                    <Edit3 size={20} />
                </div>
                <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Vocabulary Drill</h3>
            </div>

            {/* STICKY TOP WORD BANK: Mobile Optimized Spacing */}
            <div className="sticky top-2 z-30 mb-6 -mx-2 px-2">
                <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-3 md:p-4 border border-slate-200/50 shadow-md flex flex-wrap gap-2 min-h-[60px] justify-center items-center transition-all duration-300">
                    {wordBank.length === 0 && !isChecked ? (
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-emerald-500" /> All placed
                        </span>
                    ) : (
                        wordBank.map((item) => (
                            <button 
                                key={item.id} onClick={() => handleBankClick(item)} disabled={isChecked}
                                className="px-3 py-2 md:px-4 md:py-2.5 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:border-indigo-400 hover:text-indigo-600 transition-all disabled:opacity-50 active:scale-95 text-sm"
                            >
                                {item.word}
                            </button>
                        ))
                    )}
                </div>
            </div>

            <div className="text-lg md:text-xl font-medium text-slate-700 leading-[2.5rem] md:leading-loose flex flex-wrap items-center gap-y-3 mb-6">
                {textParts.map((part: string, i: number) => {
                    const isLast = i === textParts.length - 1;
                    const filledItem = filledBlanks[i];
                    
                    let blankStyle = "min-w-[80px] h-10 bg-slate-50 border-b-4 border-slate-200 mx-1 flex items-center justify-center px-3 cursor-pointer transition-all rounded-t-xl";
                    if (filledItem) blankStyle = "min-w-[80px] h-10 bg-indigo-50 border-b-4 border-indigo-400 text-indigo-700 font-bold rounded-xl mx-1 flex items-center justify-center px-3 cursor-pointer shadow-sm active:scale-95 transition-all";
                    
                    if (isChecked && filledItem) {
                        const isCorrect = filledItem.word === correctAnswers[i];
                        blankStyle = `min-w-[80px] h-10 font-bold rounded-xl mx-1 flex items-center justify-center px-3 shadow-sm text-white ${isCorrect ? 'bg-emerald-500 border-emerald-500' : 'bg-rose-500 border-rose-500'}`;
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
                <div className="mt-4 pt-6 border-t border-slate-100 animate-in slide-in-from-bottom-2">
                    <button onClick={checkAnswers} className="w-full py-4 bg-emerald-500 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-emerald-600 shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">
                        Check Answers
                    </button>
                </div>
            )}

            {isChecked && (
                <div className="mt-4 pt-6 border-t border-slate-100 flex justify-center animate-in zoom-in-95">
                    {isEntirelyCorrect ? (
                        <div className="w-full py-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold flex items-center justify-center gap-2">
                            <CheckCircle2 size={20}/> Perfectly Placed!
                        </div>
                    ) : (
                        <button onClick={() => { 
                            setFilledBlanks(Array(correctAnswers.length).fill(null)); 
                            setWordBank(initialWordBank); 
                            setIsChecked(false); 
                        }} className="w-full py-4 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl font-bold hover:bg-rose-100 active:scale-95 transition-all">
                            Try Again
                        </button>
                    )}
                </div>
            )}
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
        <div className="bg-slate-900 p-5 md:p-8 rounded-[2.5rem] shadow-xl my-6 text-white relative overflow-hidden group">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-rose-500/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-rose-500/30 transition-colors duration-700" />
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-rose-500/20 text-rose-400 rounded-xl flex items-center justify-center border border-rose-500/30 shrink-0">
                        <MessageSquare size={20} />
                    </div>
                    <h3 className="text-xs font-black text-rose-400 uppercase tracking-widest">Interactive Branch</h3>
                </div>
                <h4 className="text-xl md:text-2xl font-black mb-3 leading-tight">{title}</h4>
                <p className="text-sm md:text-base text-slate-300 font-medium leading-relaxed mb-8 italic">"{context}"</p>
                <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">How do you respond?</p>
                    {options.map((opt: any, i: number) => {
                        const safeOpt = String(opt);
                        return (
                            <button 
                                key={i} onClick={() => setSelectedOpt(safeOpt)}
                                className={`w-full p-4 border rounded-2xl text-left font-bold text-sm transition-all active:scale-[0.98] ${
                                    selectedOpt === safeOpt ? 'bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-500/20' : 'bg-white/10 hover:bg-white/20 border-white/10'
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
        return cats.map(c => String(c));
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
            setItems(items.filter(i => i.id !== selectedItem.id));
            setSelectedItem(null);
        }
    };

    return (
        <div className="bg-amber-50 p-5 md:p-8 rounded-[3rem] border-4 border-amber-100 my-8 shadow-sm relative flex flex-col">
            <div className="flex items-center justify-center gap-3 mb-6">
                <MousePointerClick className="text-amber-500" size={24} />
                <h3 className="text-xl md:text-2xl font-black text-amber-900 text-center">{String(block.title || 'Sort the Items!')}</h3>
            </div>
            
            <div className="sticky top-2 z-30 mb-8 -mx-2 px-2">
                <div className="bg-white/90 backdrop-blur-2xl rounded-[2rem] p-3 md:p-4 border border-slate-200/50 shadow-md flex flex-wrap justify-center gap-2 min-h-[80px] transition-all duration-300">
                    {items.length === 0 && <p className="text-amber-500 font-bold uppercase tracking-widest my-auto flex items-center gap-2"><CheckCircle2 size={16}/> All sorted!</p>}
                    {items.map((item) => (
                        <button 
                            key={item.id} 
                            onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)} 
                            className={`px-4 py-2 rounded-2xl font-black text-sm md:text-base transition-all duration-300 shadow-md ${selectedItem?.id === item.id ? 'bg-indigo-600 text-white scale-110 -translate-y-1 ring-4 ring-indigo-200' : 'bg-white text-slate-700 hover:scale-105 active:scale-95'}`}
                        >
                            {item.emoji} {item.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {parsedCategories.map((cat: string) => {
                    return (
                        <button key={cat} onClick={() => handleBucketClick(cat)} className={`p-5 rounded-[2rem] border-4 transition-colors flex flex-col items-center gap-4 ${selectedItem ? 'border-indigo-400 bg-indigo-50 animate-pulse cursor-pointer' : 'border-amber-200 bg-amber-100/50 cursor-default'}`}>
                            <h4 className="font-black text-amber-900 text-lg md:text-xl text-center leading-tight">{cat}</h4>
                            <div className="flex flex-wrap justify-center gap-2">
                                {placed[cat]?.map(item => (
                                    <div key={item.id} className="px-3 py-1.5 bg-white rounded-xl text-sm font-black shadow-sm flex items-center gap-1">
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

// ============================================================================
//  NEW RENDERERS: AUDIO STORY & IMAGE HOTSPOT
// ============================================================================

const AudioStoryBlockRenderer = ({ block }: any) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const togglePlay = () => setIsPlaying(!isPlaying);

    return (
        <div className="bg-white rounded-[3rem] overflow-hidden shadow-xl border-4 border-indigo-50 my-8">
            <div className="relative">
                <img src={String(block.imageUrl || 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?q=80&w=800&auto=format&fit=crop')} alt="Story visual" className="w-full h-64 md:h-80 object-cover" />
                <button onClick={togglePlay} className={`absolute -bottom-8 right-8 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${isPlaying ? 'bg-rose-500 text-white scale-110' : 'bg-indigo-600 text-white hover:scale-105'}`}>
                    {isPlaying ? <Square fill="currentColor" size={24} /> : <Play fill="currentColor" size={28} className="ml-1" />}
                </button>
            </div>
            <div className="p-8 md:p-10 pt-12">
                <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Volume2 size={16} /> Read Along</h3>
                <p className={`text-3xl md:text-4xl font-bold text-slate-800 leading-snug transition-colors duration-500 ${isPlaying ? 'text-indigo-600' : ''}`}>{String(block.text || "The legend says they looked for an eagle on a cactus...")}</p>
            </div>
        </div>
    );
};

const ImageHotspotBlockRenderer = ({ block }: any) => {
    const [activeSpot, setActiveSpot] = useState<number | null>(null);

    return (
        <div className="bg-slate-900 p-6 md:p-8 rounded-[3rem] shadow-2xl my-8">
            <div className="flex items-center justify-center gap-3 mb-6"><Search className="text-cyan-400" size={24} /><h3 className="text-2xl font-black text-white text-center">{String(block.title || 'Explore the Map!')}</h3></div>
            <div className="relative rounded-[2rem] overflow-hidden border-4 border-slate-700 bg-slate-800">
                <img src={String(block.imageUrl || 'https://images.unsplash.com/photo-1565670119853-23910c2830f3?q=80&w=800&auto=format&fit=crop')} className="w-full h-auto opacity-80" alt="Explorer Map" />
                {(Array.isArray(block.hotspots) ? block.hotspots : []).map((spot: any, i: number) => (
                    <React.Fragment key={i}>
                        <button onClick={() => setActiveSpot(activeSpot === i ? null : i)} className="absolute w-10 h-10 md:w-12 md:h-12 bg-rose-500 rounded-full border-4 border-white shadow-[0_0_20px_rgba(244,63,94,0.8)] flex items-center justify-center animate-pulse hover:scale-110 transition-transform z-10" style={{ top: `${spot.y || 0}%`, left: `${spot.x || 0}%`, transform: 'translate(-50%, -50%)' }}>
                            <Search size={18} className="text-white" strokeWidth={3} />
                        </button>
                        {activeSpot === i && (
                            <div className="absolute z-20 bg-white p-5 rounded-[2rem] shadow-2xl w-56 text-center animate-in zoom-in-95 duration-200" style={{ top: `${spot.y || 0}%`, left: `${spot.x || 0}%`, transform: 'translate(-50%, -115%)' }}>
                                <h4 className="text-xl font-black text-indigo-600 mb-2 leading-tight">{String(spot.title || '')}</h4>
                                <p className="text-sm font-bold text-slate-600 leading-snug">{String(spot.description || '')}</p>
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-white rotate-45"></div>
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
        <div className="bg-white p-5 md:p-8 rounded-[3rem] border-4 border-slate-100 shadow-xl my-8">
            <div className="flex items-center justify-between mb-4 md:mb-6">
                <h3 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-2 md:gap-3">
                    <Palette className="text-fuchsia-500 shrink-0" size={24} /> 
                    <span className="truncate">{String(block.title || "Let's Draw!")}</span>
                </h3>
                <button onClick={() => canvasRef.current?.getContext('2d')?.clearRect(0,0,800,400)} className="p-3 bg-slate-100 text-slate-500 rounded-full hover:bg-rose-100 hover:text-rose-500 transition-colors shrink-0">
                    <Eraser size={20} />
                </button>
            </div>
            <div className="bg-slate-50 rounded-[2rem] overflow-hidden border-2 border-slate-200 touch-none mb-6 select-none" style={{ touchAction: 'none' }}>
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
            <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                {colors.map(c => (<button key={c} onClick={() => setColor(c)} className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-4 transition-transform ${color === c ? 'scale-125 border-slate-200 shadow-lg' : 'border-transparent hover:scale-110'}`} style={{ backgroundColor: c }} />))}
            </div>
        </div>
    );
};

// ============================================================================
//  MAIN LESSON VIEW PLAYER
// ============================================================================

export default function LessonView({ lesson, onFinish, isInstructor = true }: LessonViewProps) {
  const [activePageIdx, setActivePageIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<any>(null); 

  const pages = useMemo(() => {
    if (!lesson || !Array.isArray(lesson.blocks)) return [];
    
    const grouped: any[] = [];
    let buffer: any[] = [];
    
    const allowedTypes = ['quiz', 'flashcard', 'scenario', 'fill-blank', 'discussion', 'game', 'code', 'formula', 'timeline', 'audio-story', 'image-hotspot', 'drag-drop', 'drawing'];
    
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
  }, [activePageIdx, pages.length]);

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
      case 'drag-drop': return <div key={blockKey} className="animate-in slide-in-from-bottom-4 fade-in"><TapSortBlockRenderer block={block} /></div>;
      case 'audio-story': return <div key={blockKey} className="animate-in slide-in-from-bottom-4 fade-in"><AudioStoryBlockRenderer block={block} /></div>;
      case 'image-hotspot': return <div key={blockKey} className="animate-in slide-in-from-bottom-4 fade-in"><ImageHotspotBlockRenderer block={block} /></div>;
      case 'drawing': return <div key={blockKey} className="animate-in slide-in-from-bottom-4 fade-in"><DrawingBlockRenderer block={block} /></div>;

      case 'code':
        return (
          <div key={blockKey} className="py-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-[#0D1117] rounded-[2.5rem] overflow-hidden shadow-xl border border-slate-800">
              <div className="bg-white/5 px-4 md:px-6 py-3 md:py-4 flex justify-between items-center border-b border-white/5"><div className="flex gap-2"><div className="w-3 h-3 rounded-full bg-rose-500/80"></div><div className="w-3 h-3 rounded-full bg-amber-500/80"></div><div className="w-3 h-3 rounded-full bg-emerald-500/80"></div></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{String(block.language || 'Terminal')}</span></div>
              <div className="p-5 md:p-8 overflow-x-auto custom-scrollbar"><pre className="text-emerald-400 font-mono text-sm md:text-base leading-relaxed"><code>{String(block.content || '')}</code></pre></div>
            </div>
          </div>
        );
      case 'timeline':
        return (
           <div key={blockKey} className="py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {block.title && (<div className="flex items-center gap-3 mb-8"><div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><BookOpen size={20} /></div><h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">{String(block.title)}</h3></div>)}
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1.5 before:bg-slate-100 before:rounded-full">
                 {(Array.isArray(block.events) ? block.events : []).map((event: any, evIdx: number) => (
                    <div key={evIdx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-white bg-indigo-600 text-white shadow-md shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform group-hover:scale-110"><div className="w-2.5 h-2.5 bg-white rounded-full" /></div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-5 md:p-8 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-lg transition-shadow group-hover:border-indigo-100">
                            <span className="font-black text-indigo-600 text-[10px] tracking-[0.2em] uppercase mb-2 block">{String(event.date || '')}</span>
                            <h4 className="font-black text-slate-800 text-lg leading-tight mb-2">{String(event.title || '')}</h4>
                            <p className="text-slate-600 text-sm font-medium leading-relaxed">{String(event.description || '')}</p>
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
            {title && <span className="inline-block px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] mb-4">{String(title)}</span>}
            <div className="text-xl md:text-3xl font-bold text-slate-700 leading-snug md:leading-snug tracking-tight whitespace-pre-wrap">{String(textBody)}</div>
          </div>
        );
      }
      
      case 'essay':
        return (
          <div key={blockKey} className="py-4 space-y-6 animate-in fade-in">
            <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                {block.title && (<div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-50"><div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0"><BookOpen size={18} /></div><h3 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">{String(block.title)}</h3></div>)}
                <div className="text-slate-600 font-medium text-base md:text-lg leading-relaxed space-y-6 tracking-wide">
                    {String(block.content || '').split('\n').map((p: string, j: number) => { if (!p.trim()) return null; return <p key={j}>{p}</p>; })}
                </div>
            </div>
          </div>
        );
      
      case 'quiz': return <div key={blockKey} className="animate-in slide-in-from-bottom-4 fade-in"><QuizBlockRenderer block={block} /></div>;
      case 'fill-blank': return <div key={blockKey} className="animate-in slide-in-from-bottom-4 fade-in"><FillBlankBlockRenderer block={block} /></div>;
      case 'scenario': return <div key={blockKey} className="animate-in slide-in-from-bottom-4 fade-in"><ScenarioBlockRenderer block={block} /></div>;

      default:
        return <div key={blockKey} className="p-8 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200 text-center text-xs text-slate-400 font-bold uppercase tracking-widest my-4">Unsupported Module: {blockType}</div>;
    }
  };

  if (!pages || pages.length === 0) {
      return (
          <div className="h-full flex items-center justify-center bg-slate-50">
              <div className="text-center p-8 bg-white rounded-3xl shadow-sm border border-slate-100 max-w-md mx-4">
                  <AlertTriangle className="mx-auto mb-4 text-rose-500" size={48} />
                  <h2 className="text-xl font-black text-slate-800 mb-2">Module Offline</h2>
                  <p className="text-slate-500 font-medium">The data for this lesson appears to be corrupted or missing. Please contact your instructor.</p>
                  <button onClick={onFinish} className="mt-6 px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all">Return to Hub</button>
              </div>
          </div>
      );
  }

  const safePageIdx = Math.min(activePageIdx, pages.length - 1);
  const activePage = pages[safePageIdx];
  const progressPercent = ((safePageIdx + 1) / pages.length) * 100;

  return (
    <div className="flex flex-col min-h-[100dvh] h-[100dvh] bg-slate-50/50 overflow-hidden font-sans relative">
      <div className="px-5 md:px-8 pt-8 md:pt-10 pb-4 bg-white border-b border-slate-100 shrink-0 shadow-sm relative z-10">
        <div className="flex justify-between items-end">
          <div>
              <h1 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] mb-1 truncate max-w-[200px] md:max-w-md">{String(lesson?.title || 'Active Session')}</h1>
              <p className="text-lg md:text-xl font-black text-slate-900 tracking-tight leading-none">Current Session</p>
          </div>
          {isInstructor && (
            <div className="flex items-center gap-2 px-2 py-1 bg-emerald-50 rounded-md border border-emerald-100">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[8px] font-black text-emerald-600 uppercase">Live</span>
            </div>
          )}
        </div>
      </div>
      
      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 md:px-10 py-6 pb-32 custom-scrollbar scroll-smooth relative z-0">
        <div className="max-w-2xl mx-auto space-y-4">
          {activePage?.blocks?.map((block: any, i: number) => renderBlock(block, i))}
        </div>
      </div>
      
      <div className="px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-5 bg-white/95 backdrop-blur-2xl border-t border-slate-100 flex justify-between items-center fixed bottom-0 left-0 right-0 z-50 shadow-[0_-15px_30px_rgba(0,0,0,0.04)]">
        <div className="absolute top-0 left-0 h-1 bg-slate-100 w-full overflow-hidden">
            <div className="h-full bg-indigo-500 transition-all duration-500 ease-out" style={{ width: `${progressPercent}%` }} />
        </div>
        <button onClick={handlePrev} className="p-3 md:p-4 bg-slate-100 text-slate-500 rounded-2xl disabled:opacity-30 active:scale-95 transition-all hover:bg-slate-200" disabled={safePageIdx === 0}><ArrowLeft size={20} strokeWidth={2.5} /></button>
        <div className="text-center flex flex-col items-center">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Progress</span>
            <span className="text-base md:text-lg font-black text-slate-900">{safePageIdx + 1} <span className="text-slate-300 mx-0.5">/</span> {pages.length}</span>
        </div>
        {safePageIdx < pages.length - 1 ? (
          <button onClick={handleNext} className="p-3 md:p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200 active:scale-95 transition-all hover:bg-indigo-500 hover:-translate-y-0.5"><ArrowRight size={20} strokeWidth={2.5} /></button>
        ) : (
          <button onClick={onFinish} className="px-6 py-3 md:px-8 md:py-4 bg-emerald-500 text-white font-black rounded-2xl shadow-lg shadow-emerald-200 active:scale-95 transition-all text-xs tracking-widest hover:bg-emerald-400 hover:-translate-y-0.5">FINISH</button>
        )}
      </div>
    </div>
  );
}
