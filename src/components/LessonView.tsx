// src/components/LessonView.tsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  HelpCircle, CheckCircle2, X, Edit3, MessageSquare, 
  MessageCircle, ArrowLeft, ArrowRight, Info, Zap, BookOpen,
  Play, Square, Search, MousePointerClick, Palette, Eraser, Volume2, Gamepad2
} from 'lucide-react';

export interface LessonViewProps {
    lessonId?: string | null;
    lessons?: any[];
    lesson: any;
    onFinish: () => void;
    isInstructor?: boolean;
}

// ============================================================================
//  INTERACTIVE RENDERERS (Core)
// ============================================================================

const QuizBlockRenderer = ({ block }: any) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const data = block?.content || block?.data || block || {};
    // 🔥 SAFETY: Force string type to prevent React child rendering crashes
    const question = typeof data.question === 'string' ? data.question : String(data.question || "Missing Question Data");
    
    let options = data.options || [];
    if (!Array.isArray(options)) options = [];

    const normalizedOptions = options.map((opt: any, idx: number) => {
        if (typeof opt === 'string') return { id: `opt_${idx}`, text: opt };
        return { id: opt.id || `opt_${idx}`, text: opt.text || opt.label || opt.value || "Unknown Option" };
    });

    let correctId = data.correctId;
    if (correctId === undefined) {
         if (data.correctIndex !== undefined) correctId = normalizedOptions[data.correctIndex]?.id;
         else if (data.correctAnswer) {
             const found = normalizedOptions.find((o:any) => o.text === data.correctAnswer);
             correctId = found?.id;
         }
    }
    if (correctId === undefined && normalizedOptions.length > 0) correctId = normalizedOptions[0].id;
    const isCorrect = selectedId === correctId;

    return (
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm my-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500" />
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner">
                    <HelpCircle size={20} strokeWidth={2.5} />
                </div>
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest">Knowledge Check</h3>
            </div>
            
            <h4 className="text-xl font-black text-slate-800 mb-6 leading-snug">{question}</h4>
            
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
                                className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 font-bold text-left transition-all active:scale-[0.98] disabled:active:scale-100 ${btnStyle}`}
                            >
                                <span>{opt.text}</span>
                                {isOptCorrect && <CheckCircle2 size={20} className="text-white" />}
                                {isOptWrong && <X size={20} className="text-white" />}
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
                <div className={`mt-6 p-4 rounded-xl flex justify-between items-center animate-in zoom-in ${isCorrect ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                    <span className="font-bold flex items-center gap-2">
                        {isCorrect ? <><CheckCircle2 size={20}/> Correct!</> : <><X size={20}/> Incorrect</>}
                    </span>
                    {!isCorrect && (
                        <button onClick={() => { setIsSubmitted(false); setSelectedId(null); }} className="px-4 py-2 bg-white rounded-lg text-xs font-black uppercase tracking-widest shadow-sm hover:shadow active:scale-95 transition-all text-rose-600 border border-rose-200">
                            Try Again
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

const FillBlankBlockRenderer = ({ block }: any) => {
    const data = block?.content || block?.data || block || {};
    // 🔥 SAFETY: Force string conversion to completely eliminate .split() crashes
    const rawText = typeof data.text === 'string' ? data.text : "Missing text [here].";
    
    const { textParts, correctAnswers } = useMemo(() => {
        const parts = rawText.split(/\[.*?\]/g);
        const matches = Array.from(rawText.matchAll(/\[(.*?)\]/g));
        const answers = matches.map((m: any) => m[1]); 
        return { textParts: parts, correctAnswers: answers };
    }, [rawText]);

    // 🔥 SAFETY: Stringify distractors to prevent reference-based infinite loops
    const distractorsString = JSON.stringify(data.options || data.distractors || []);

    const distractors = useMemo(() => {
        let rawOptions = JSON.parse(distractorsString);
        if (!Array.isArray(rawOptions)) rawOptions = typeof rawOptions === 'string' ? [rawOptions] : [];
        return rawOptions.map((opt: any) => {
            if (typeof opt === 'string' || typeof opt === 'number') return String(opt);
            if (opt && typeof opt === 'object') return opt.text || opt.label || opt.value || "";
            return "";
        }).filter(Boolean);
    }, [distractorsString]);

    const [wordBank, setWordBank] = useState<{id: string, word: string}[]>([]);
    const [filledBlanks, setFilledBlanks] = useState<{id: string, word: string} | null[]>([]);
    const [isChecked, setIsChecked] = useState(false);

    // 🔥 SAFETY: Initialize arrays based ONLY on stable string values
    useEffect(() => {
        const allWords = [...correctAnswers, ...distractors].map((w, i) => ({ id: `word_${i}_${w}`, word: w }));
        setWordBank(allWords.sort(() => Math.random() - 0.5));
        setFilledBlanks(Array(correctAnswers.length).fill(null));
        setIsChecked(false);
    }, [correctAnswers.join(','), distractors.join(',')]);

    const handleBankClick = (item: {id: string, word: string}) => {
        if (isChecked) return;
        const firstEmptyIdx = filledBlanks.indexOf(null as any);
        if (firstEmptyIdx !== -1) {
            const newFilled = [...filledBlanks];
            newFilled[firstEmptyIdx] = item;
            setFilledBlanks(newFilled);
            
            const newBank = wordBank.filter(w => w.id !== item.id);
            setWordBank(newBank);
        }
    };

    const handleBlankClick = (item: {id: string, word: string} | null, idx: number) => {
        if (isChecked || !item) return;
        const newFilled = [...filledBlanks];
        newFilled[idx] = null as any;
        setFilledBlanks(newFilled);
        setWordBank([...wordBank, item]);
    };

    const isComplete = filledBlanks.every(slot => slot !== null);

    return (
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm my-6 relative flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shadow-inner shrink-0">
                        <Edit3 size={20} />
                    </div>
                    <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Vocabulary Drill</h3>
                </div>
            </div>

            {/* STICKY TOP WORD BANK */}
            <div className="sticky top-4 z-30 mb-8 -mx-2 px-2">
                <div className="bg-white/80 backdrop-blur-2xl rounded-2xl p-4 border border-slate-200/50 shadow-[0_10px_30px_rgba(0,0,0,0.08)] flex flex-wrap gap-2 min-h-[60px] justify-center items-center transition-all duration-300">
                    {wordBank.length === 0 && !isChecked ? (
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-emerald-500" /> All words placed
                        </span>
                    ) : (
                        wordBank.map((item) => (
                            <button 
                                key={item.id} onClick={() => handleBankClick(item)} disabled={isChecked}
                                className="px-4 py-2.5 bg-white border-2 border-slate-200 text-slate-700 font-black rounded-xl shadow-sm hover:border-indigo-400 hover:text-indigo-600 transition-all disabled:opacity-50 active:scale-95 text-sm md:text-base"
                            >
                                {item.word}
                            </button>
                        ))
                    )}
                </div>
            </div>

            <div className="text-xl md:text-2xl font-medium text-slate-700 leading-relaxed md:leading-loose flex flex-wrap items-center gap-y-5 mb-6">
                {textParts.map((part: string, i: number) => {
                    const isLast = i === textParts.length - 1;
                    const filledItem = filledBlanks[i];
                    
                    let blankStyle = "min-w-[100px] h-12 border-b-4 border-slate-200 mx-2 flex items-center justify-center px-4 cursor-pointer transition-all";
                    if (filledItem) blankStyle = "min-w-[100px] h-12 bg-indigo-100 text-indigo-700 font-bold rounded-xl mx-2 flex items-center justify-center px-4 cursor-pointer shadow-sm hover:bg-rose-100 hover:text-rose-600 transition-all active:scale-95";
                    
                    if (isChecked && filledItem) {
                        const isCorrect = filledItem.word === correctAnswers[i];
                        blankStyle = `min-w-[100px] h-12 font-bold rounded-xl mx-2 flex items-center justify-center px-4 shadow-sm text-white ${isCorrect ? 'bg-emerald-500 border-emerald-500' : 'bg-rose-500 border-rose-500'}`;
                    }

                    return (
                        <React.Fragment key={`part_${i}`}>
                            <span className="py-2">{part}</span>
                            {!isLast && (
                                <div onClick={() => handleBlankClick(filledItem, i)} className={blankStyle}>
                                    {filledItem ? filledItem.word : ""}
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {isComplete && !isChecked && (
                <div className="mt-4 pt-6 border-t border-slate-100 animate-in slide-in-from-bottom-2">
                    <button onClick={() => setIsChecked(true)} className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-600 shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">
                        Check Answers
                    </button>
                </div>
            )}
        </div>
    );
};

const ScenarioBlockRenderer = ({ block }: any) => {
    const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
    // 🔥 SAFETY: Fallbacks to prevent UI crashing on corrupted objects
    const title = typeof block.title === 'string' ? block.title : (typeof block?.content?.title === 'string' ? block.content.title : "Real-World Scenario");
    const context = typeof block.context === 'string' ? block.context : (typeof block?.content?.context === 'string' ? block.content.context : "Scenario context goes here...");
    
    let options = block.options || block?.content?.options || block?.data?.options || [];
    if (!Array.isArray(options)) options = [];
    
    return (
        <div className="bg-slate-900 p-6 md:p-8 rounded-[2.5rem] shadow-xl my-6 text-white relative overflow-hidden group">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-rose-500/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-rose-500/30 transition-colors duration-700" />
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-rose-500/20 text-rose-400 rounded-xl flex items-center justify-center border border-rose-500/30">
                        <MessageSquare size={20} />
                    </div>
                    <h3 className="text-xs font-black text-rose-400 uppercase tracking-widest">Interactive Branch</h3>
                </div>
                <h4 className="text-2xl font-black mb-3 leading-tight">{title}</h4>
                <p className="text-slate-300 font-medium leading-relaxed mb-8 italic">"{context}"</p>
                <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">How do you respond?</p>
                    {options.map((opt: string, i: number) => (
                        <button 
                            key={i} onClick={() => setSelectedOpt(opt)}
                            className={`w-full p-4 border rounded-2xl text-left font-bold text-sm transition-all active:scale-[0.98] ${
                                selectedOpt === opt ? 'bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-500/20' : 'bg-white/10 hover:bg-white/20 border-white/10'
                            }`}
                        >
                            {typeof opt === 'string' ? opt : String(opt)}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ============================================================================
//  INTERACTIVE RENDERERS (K-1 Primary)
// ============================================================================

const AudioStoryBlockRenderer = ({ block }: any) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const togglePlay = () => setIsPlaying(!isPlaying);

    return (
        <div className="bg-white rounded-[3rem] overflow-hidden shadow-xl border-4 border-indigo-50 my-8">
            <div className="relative">
                <img src={block.imageUrl || 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?q=80&w=800&auto=format&fit=crop'} alt="Story visual" className="w-full h-64 md:h-80 object-cover" />
                <button onClick={togglePlay} className={`absolute -bottom-8 right-8 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${isPlaying ? 'bg-rose-500 text-white scale-110' : 'bg-indigo-600 text-white hover:scale-105'}`}>
                    {isPlaying ? <Square fill="currentColor" size={24} /> : <Play fill="currentColor" size={28} className="ml-1" />}
                </button>
            </div>
            <div className="p-8 md:p-10 pt-12">
                <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Volume2 size={16} /> Read Along</h3>
                <p className={`text-3xl md:text-4xl font-bold text-slate-800 leading-snug transition-colors duration-500 ${isPlaying ? 'text-indigo-600' : ''}`}>{typeof block.text === 'string' ? block.text : "The legend says they looked for an eagle on a cactus..."}</p>
            </div>
        </div>
    );
};

const ImageHotspotBlockRenderer = ({ block }: any) => {
    const [activeSpot, setActiveSpot] = useState<number | null>(null);

    return (
        <div className="bg-slate-900 p-6 md:p-8 rounded-[3rem] shadow-2xl my-8">
            <div className="flex items-center justify-center gap-3 mb-6"><Search className="text-cyan-400" size={24} /><h3 className="text-2xl font-black text-white text-center">{typeof block.title === 'string' ? block.title : 'Explore the Map!'}</h3></div>
            <div className="relative rounded-[2rem] overflow-hidden border-4 border-slate-700 bg-slate-800">
                <img src={block.imageUrl || 'https://images.unsplash.com/photo-1565670119853-23910c2830f3?q=80&w=800&auto=format&fit=crop'} className="w-full h-auto opacity-80" alt="Explorer Map" />
                {(Array.isArray(block.hotspots) ? block.hotspots : []).map((spot: any, i: number) => (
                    <React.Fragment key={i}>
                        <button onClick={() => setActiveSpot(activeSpot === i ? null : i)} className="absolute w-10 h-10 md:w-12 md:h-12 bg-rose-500 rounded-full border-4 border-white shadow-[0_0_20px_rgba(244,63,94,0.8)] flex items-center justify-center animate-pulse hover:scale-110 transition-transform z-10" style={{ top: `${spot.y}%`, left: `${spot.x}%`, transform: 'translate(-50%, -50%)' }}>
                            <Search size={18} className="text-white" strokeWidth={3} />
                        </button>
                        {activeSpot === i && (
                            <div className="absolute z-20 bg-white p-5 rounded-[2rem] shadow-2xl w-56 text-center animate-in zoom-in-95 duration-200" style={{ top: `${spot.y}%`, left: `${spot.x}%`, transform: 'translate(-50%, -115%)' }}>
                                <h4 className="text-xl font-black text-indigo-600 mb-2 leading-tight">{spot.title}</h4>
                                <p className="text-sm font-bold text-slate-600 leading-snug">{spot.description}</p>
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-white rotate-45"></div>
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

const TapSortBlockRenderer = ({ block }: any) => {
    const [items, setItems] = useState<any[]>(Array.isArray(block.items) ? block.items : []);
    const [placed, setPlaced] = useState<Record<string, any[]>>({});
    const [selectedItem, setSelectedItem] = useState<any>(null);

    useEffect(() => {
        const init: any = {};
        const categories = Array.isArray(block.categories) ? block.categories : [];
        categories.forEach((c: string) => init[c] = []);
        setPlaced(init);
    }, [block]);

    const handleBucketClick = (category: string) => {
        if (selectedItem) {
            setPlaced(prev => ({...prev, [category]: [...(prev[category] || []), selectedItem]}));
            setItems(items.filter(i => i.id !== selectedItem.id));
            setSelectedItem(null);
        }
    };

    return (
        <div className="bg-amber-50 p-6 md:p-8 rounded-[3rem] border-4 border-amber-100 my-8 shadow-sm relative flex flex-col">
            <div className="flex items-center justify-center gap-3 mb-6">
                <MousePointerClick className="text-amber-500" size={24} />
                <h3 className="text-2xl font-black text-amber-900 text-center">{typeof block.title === 'string' ? block.title : 'Sort the Items!'}</h3>
            </div>
            
            <div className="sticky top-4 z-30 mb-10 -mx-2 px-2">
                <div className="bg-white/90 backdrop-blur-2xl rounded-[2rem] p-4 border border-slate-200/50 shadow-[0_10px_30px_rgba(0,0,0,0.08)] flex flex-wrap justify-center gap-3 min-h-[80px] transition-all duration-300">
                    {items.length === 0 && <p className="text-amber-500 font-bold uppercase tracking-widest my-auto flex items-center gap-2"><CheckCircle2 size={16}/> All sorted!</p>}
                    {items.map((item) => (
                        <button 
                            key={item.id} 
                            onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)} 
                            className={`px-5 py-3 rounded-2xl font-black text-lg transition-all duration-300 shadow-md ${selectedItem?.id === item.id ? 'bg-indigo-600 text-white scale-110 -translate-y-1 ring-4 ring-indigo-200' : 'bg-white text-slate-700 hover:scale-105 active:scale-95'}`}
                        >
                            {item.emoji} {typeof item.label === 'string' ? item.label : ''}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {(Array.isArray(block.categories) ? block.categories : []).map((cat: string) => (
                    <button key={cat} onClick={() => handleBucketClick(cat)} className={`p-6 rounded-[2rem] border-4 transition-colors flex flex-col items-center gap-4 ${selectedItem ? 'border-indigo-400 bg-indigo-50 animate-pulse cursor-pointer' : 'border-amber-200 bg-amber-100/50 cursor-default'}`}>
                        <h4 className="font-black text-amber-900 text-xl text-center leading-tight">{cat}</h4>
                        <div className="flex flex-wrap justify-center gap-2">{placed[cat]?.map(item => (<div key={item.id} className="px-3 py-1.5 bg-white rounded-xl text-sm font-black shadow-sm flex items-center gap-1">{item.emoji} <span className="hidden md:inline">{item.label}</span></div>))}</div>
                    </button>
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

    const startDrawing = (e: any) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const clientX = e.clientX || e.touches?.[0]?.clientX;
        const clientY = e.clientY || e.touches?.[0]?.clientY;
        const rect = canvas.getBoundingClientRect();
        ctx.beginPath();
        ctx.moveTo(clientX - rect.left, clientY - rect.top);
        setIsDrawing(true);
    };

    const draw = (e: any) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        const clientX = e.clientX || e.touches?.[0]?.clientX;
        const clientY = e.clientY || e.touches?.[0]?.clientY;
        const rect = canvas.getBoundingClientRect();
        ctx.lineTo(clientX - rect.left, clientY - rect.top);
        ctx.strokeStyle = color;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.stroke();
    };

    return (
        <div className="bg-white p-6 md:p-8 rounded-[3rem] border-4 border-slate-100 shadow-xl my-8">
            <div className="flex items-center justify-between mb-6"><h3 className="text-2xl font-black text-slate-800 flex items-center gap-3"><Palette className="text-fuchsia-500" /> {typeof block.title === 'string' ? block.title : "Let's Draw!"}</h3><button onClick={() => canvasRef.current?.getContext('2d')?.clearRect(0,0,800,400)} className="p-3 bg-slate-100 text-slate-500 rounded-full hover:bg-rose-100 hover:text-rose-500 transition-colors"><Eraser size={20} /></button></div>
            <div className="bg-slate-50 rounded-[2rem] overflow-hidden border-2 border-slate-200 touch-none mb-6">
                <canvas ref={canvasRef} width={800} height={400} className="w-full h-64 md:h-80 cursor-crosshair" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={() => setIsDrawing(false)} onMouseLeave={() => setIsDrawing(false)} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={() => setIsDrawing(false)} />
            </div>
            <div className="flex justify-center gap-3">
                {colors.map(c => (<button key={c} onClick={() => setColor(c)} className={`w-12 h-12 rounded-full border-4 transition-transform ${color === c ? 'scale-125 border-slate-200 shadow-lg' : 'border-transparent hover:scale-110'}`} style={{ backgroundColor: c }} />))}
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
    if (!lesson?.blocks) return [];
    const grouped: any[] = [];
    let buffer: any[] = [];
    lesson.blocks.forEach((b: any) => {
      if (['quiz', 'flashcard', 'scenario', 'fill-blank', 'discussion', 'game', 'code', 'formula', 'timeline', 'audio-story', 'image-hotspot', 'drag-drop', 'drawing'].includes(b.type)) {
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
    if (isInstructor) syncToProjector(0);
  }, [isInstructor, syncToProjector]);

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

  // --- KEYBOARD NAVIGATION (Left, Right, Up, Down) ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
        
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
    const blockKey = `page_${activePageIdx}_block_${idx}`;

    switch (block.type) {
      case 'audio-story': return <div key={blockKey} className="animate-in slide-in-from-bottom-4 fade-in"><AudioStoryBlockRenderer block={block} /></div>;
      case 'image-hotspot': return <div key={blockKey} className="animate-in slide-in-from-bottom-4 fade-in"><ImageHotspotBlockRenderer block={block} /></div>;
      case 'drag-drop': return <div key={blockKey} className="animate-in slide-in-from-bottom-4 fade-in"><TapSortBlockRenderer block={block} /></div>;
      case 'drawing': return <div key={blockKey} className="animate-in slide-in-from-bottom-4 fade-in"><DrawingBlockRenderer block={block} /></div>;

      case 'code':
        return (
          <div key={blockKey} className="py-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-[#0D1117] rounded-[2.5rem] overflow-hidden shadow-xl border border-slate-800">
              <div className="bg-white/5 px-6 py-4 flex justify-between items-center border-b border-white/5"><div className="flex gap-2"><div className="w-3 h-3 rounded-full bg-rose-500/80"></div><div className="w-3 h-3 rounded-full bg-amber-500/80"></div><div className="w-3 h-3 rounded-full bg-emerald-500/80"></div></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{typeof block.language === 'string' ? block.language : 'Terminal'}</span></div>
              <div className="p-6 md:p-8 overflow-x-auto custom-scrollbar"><pre className="text-emerald-400 font-mono text-sm md:text-base leading-relaxed"><code>{typeof block.content === 'string' ? block.content : ''}</code></pre></div>
            </div>
            {block.caption && <p className="text-xs font-bold text-slate-500 mt-4 text-center">{typeof block.caption === 'string' ? block.caption : ''}</p>}
          </div>
        );
      case 'formula':
        return (
          <div key={blockKey} className="py-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-white p-8 md:p-12 rounded-[3rem] border-2 border-slate-100 shadow-sm text-center relative overflow-hidden group"><div className="absolute top-0 left-0 w-2 h-full bg-rose-500 transition-all duration-500 group-hover:w-3" />{block.title && <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-6">{typeof block.title === 'string' ? block.title : ''}</span>}<div className="text-3xl md:text-4xl font-serif text-slate-800 tracking-tight overflow-x-auto overflow-y-hidden py-4 mx-auto max-w-full">{typeof block.content === 'string' ? block.content : ''}</div>{block.explanation && <p className="text-sm font-medium text-slate-500 mt-6 leading-relaxed max-w-lg mx-auto">{typeof block.explanation === 'string' ? block.explanation : ''}</p>}</div>
          </div>
        );
      case 'timeline':
        return (
           <div key={blockKey} className="py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {block.title && (<div className="flex items-center gap-3 mb-8"><div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><BookOpen size={20} /></div><h3 className="text-2xl font-black text-slate-800 tracking-tight">{typeof block.title === 'string' ? block.title : ''}</h3></div>)}
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1.5 before:bg-slate-100 before:rounded-full">
                 {(Array.isArray(block.events) ? block.events : []).map((event: any, evIdx: number) => (
                    <div key={evIdx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"><div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-white bg-indigo-600 text-white shadow-md shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform group-hover:scale-110"><div className="w-2.5 h-2.5 bg-white rounded-full" /></div><div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-lg transition-shadow group-hover:border-indigo-100"><span className="font-black text-indigo-600 text-[10px] tracking-[0.2em] uppercase mb-2 block">{typeof event.date === 'string' ? event.date : ''}</span><h4 className="font-black text-slate-800 text-lg leading-tight mb-2">{typeof event.title === 'string' ? event.title : ''}</h4><p className="text-slate-600 text-sm font-medium leading-relaxed">{typeof event.description === 'string' ? event.description : ''}</p></div></div>
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
        const textBody = typeof block.content === 'string' 
            ? block.content 
            : (typeof block.content?.text === 'string' ? block.content.text : (typeof block.text === 'string' ? block.text : "Missing text data."));

        return (
          <div key={blockKey} className="py-6 animate-in fade-in slide-in-from-bottom-3 duration-700">
            {title && <span className="inline-block px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] mb-4">{title}</span>}
            <div className="text-2xl md:text-3xl font-bold text-slate-700 leading-snug tracking-tight whitespace-pre-wrap">{textBody}</div>
          </div>
        );
      }
      
      case 'essay':
        return (
          <div key={blockKey} className="py-4 space-y-6 animate-in fade-in">
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">{block.title && (<div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-50"><div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500"><BookOpen size={18} /></div><h3 className="text-xl font-bold text-slate-800 tracking-tight">{typeof block.title === 'string' ? block.title : ''}</h3></div>)}<div className="text-slate-600 font-medium text-base md:text-lg leading-relaxed space-y-6 tracking-wide">{(typeof block.content === 'string' ? block.content : '').split('\n').map((p: string, j: number) => { if (!p.trim()) return null; return <p key={j}>{p}</p>; })}</div></div>
          </div>
        );
      case 'callout':
        return (
          <div key={blockKey} className="my-8 p-8 rounded-[2.5rem] bg-amber-50 border border-amber-100 relative overflow-hidden group shadow-sm"><Zap size={100} className="absolute -right-6 -top-6 text-amber-200/40 rotate-12 group-hover:scale-110 transition-transform" fill="currentColor" /><div className="relative z-10"><div className="flex items-center gap-2 mb-4"><div className="p-1.5 bg-amber-500 text-white rounded-lg shadow-sm"><Info size={16} strokeWidth={3} /></div><span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{typeof block.label === 'string' ? block.label : 'Spotlight'}</span></div><p className="text-lg text-slate-700 font-bold leading-relaxed italic pr-12">"{typeof block.content === 'string' ? block.content : ''}"</p></div></div>
        );
      case 'dialogue':
        return (
          <div key={blockKey} className="py-6 space-y-6">{(Array.isArray(block.lines) ? block.lines : []).map((line: any, j: number) => (<div key={j} className={`flex items-end gap-3 ${line.side === 'right' ? 'flex-row-reverse' : ''}`}><div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black text-white shrink-0 shadow-md ${line.side === 'right' ? 'bg-indigo-500' : 'bg-slate-300'}`}>{typeof line.speaker === 'string' ? line.speaker[0].toUpperCase() : '?'}</div><div className={`max-w-[85%] p-5 rounded-[2rem] text-base font-medium leading-relaxed ${line.side === 'right' ? 'bg-indigo-50 text-indigo-900 border border-indigo-100 rounded-br-none' : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none shadow-sm'}`}>{typeof line.text === 'string' ? line.text : ''}{typeof line.translation === 'string' && line.translation && <p className={`text-xs mt-3 italic opacity-70 font-bold border-t pt-3 ${line.side === 'right' ? 'border-indigo-200' : 'border-slate-100'}`}>{line.translation}</p>}</div></div>))}</div>
        );
      case 'vocab-list':
        return (
          <div key={blockKey} className="py-6 grid grid-cols-1 gap-3"><h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2 pl-2">Lexicon</h3>{(Array.isArray(block.items) ? block.items : []).map((item: any, j: number) => (<div key={j} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 hover:border-indigo-200 transition-all"><span className="text-lg font-bold text-indigo-600 tracking-tight min-w-[100px]">{typeof item.term === 'string' ? item.term : ''}</span><div className="h-6 w-px bg-slate-200" /><span className="text-sm font-medium text-slate-600 flex-1">{typeof item.definition === 'string' ? item.definition : ''}</span></div>))}</div>
        );
      case 'image':
        return (
          <div key={blockKey} className="py-8 animate-in fade-in"><div className="rounded-[2.5rem] overflow-hidden shadow-md border border-slate-100"><img src={typeof block.url === 'string' ? block.url : ''} alt="Lesson visual" className="w-full h-auto object-cover max-h-80" /></div>{typeof block.caption === 'string' && block.caption && <p className="text-xs font-bold text-slate-400 text-center mt-4 px-4 uppercase tracking-widest">{block.caption}</p>}</div>
        );
      case 'discussion':
        return (
          <div key={blockKey} className="py-8 animate-in fade-in"><div className="bg-indigo-50 border border-indigo-100 rounded-[2.5rem] p-8 shadow-sm"><div className="flex items-center gap-3 mb-8"><div className="p-3 bg-indigo-500 text-white rounded-xl shadow-md"><MessageCircle size={20} /></div><h3 className="text-xl font-bold text-indigo-900">{typeof block.title === 'string' ? block.title : "Discussion"}</h3></div><div className="space-y-4">{(Array.isArray(block.questions) ? block.questions : []).map((q: string, qIdx: number) => (<div key={qIdx} className="bg-white p-5 rounded-2xl shadow-sm border border-indigo-50 flex gap-4 items-start"><span className="text-indigo-300 font-black text-lg leading-none mt-1">{qIdx + 1}</span><p className="text-slate-600 font-medium leading-relaxed">{typeof q === 'string' ? q : ''}</p></div>))}</div></div></div>
        );
      
      case 'quiz': return <div key={blockKey} className="animate-in slide-in-from-bottom-4 fade-in"><QuizBlockRenderer block={block} /></div>;
      case 'fill-blank': return <div key={blockKey} className="animate-in slide-in-from-bottom-4 fade-in"><FillBlankBlockRenderer block={block} /></div>;
      case 'scenario': return <div key={blockKey} className="animate-in slide-in-from-bottom-4 fade-in"><ScenarioBlockRenderer block={block} /></div>;
      case 'game':
        if (block.gameType === 'connect-three') return (<div key={blockKey} className="py-8 animate-in fade-in slide-in-from-bottom-4 flex flex-col items-center"><div className="text-center mb-6"><h3 className="text-2xl font-black text-slate-800">{typeof block.title === 'string' ? block.title : "Vocabulary Battle"}</h3><p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Game Active on Projector</p></div><div className="w-full h-64 bg-amber-50 rounded-[2.5rem] border border-amber-200 flex items-center justify-center text-amber-500 font-bold shadow-inner">[Interactive Game View]</div></div>);
        return <div key={blockKey} className="text-rose-500">Unknown Game Type</div>;

      default:
        return <div key={blockKey} className="p-8 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200 text-center text-xs text-slate-400 font-bold uppercase tracking-widest my-4">Unsupported Module: {typeof block.type === 'string' ? block.type : 'unknown'}</div>;
    }
  };

  if (!pages[activePageIdx]) return null;

  const progressPercent = ((activePageIdx + 1) / pages.length) * 100;

  return (
    <div className="flex flex-col h-full bg-slate-50/50 overflow-hidden font-sans relative">
      
      {/* SHRUNK HEADER */}
      <div className="px-6 md:px-8 pt-8 md:pt-10 pb-4 bg-white border-b border-slate-100 shrink-0 shadow-sm relative z-10">
        <div className="flex justify-between items-end">
          <div>
              <h1 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] mb-1">{typeof lesson.title === 'string' ? lesson.title : ''}</h1>
              <p className="text-xl font-black text-slate-900 tracking-tight leading-none">Current Session</p>
          </div>
          {isInstructor && (
            <div className="flex items-center gap-2 px-2 py-1 bg-emerald-50 rounded-md border border-emerald-100">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[8px] font-black text-emerald-600 uppercase">Live</span>
            </div>
          )}
        </div>
      </div>
      
      {/* MAIN CONTENT */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-6 md:px-10 py-8 pb-32 custom-scrollbar scroll-smooth relative z-0">
        <div className="max-w-2xl mx-auto space-y-4">
          {pages[activePageIdx].blocks.map((block: any, i: number) => renderBlock(block, i))}
        </div>
      </div>
      
      {/* SLIM & POLISHED BOTTOM NAV */}
      <div className="px-6 py-4 pb-8 md:pb-5 bg-white/95 backdrop-blur-2xl border-t border-slate-100 flex justify-between items-center fixed bottom-0 left-0 right-0 z-50 shadow-[0_-15px_30px_rgba(0,0,0,0.04)]">
        
        {/* Sleek Top-Edge Progress Bar */}
        <div className="absolute top-0 left-0 h-1 bg-slate-100 w-full overflow-hidden">
            <div className="h-full bg-indigo-500 transition-all duration-500 ease-out" style={{ width: `${progressPercent}%` }} />
        </div>

        <button 
            onClick={handlePrev} 
            className="p-4 bg-slate-100 text-slate-500 rounded-2xl disabled:opacity-30 active:scale-95 transition-all hover:bg-slate-200" 
            disabled={activePageIdx === 0}
        >
            <ArrowLeft size={20} strokeWidth={2.5} />
        </button>
        
        <div className="text-center flex flex-col items-center">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Progress</span>
            <span className="text-lg font-black text-slate-900">{activePageIdx + 1} <span className="text-slate-300 mx-0.5">/</span> {pages.length}</span>
        </div>
        
        {activePageIdx < pages.length - 1 ? (
          <button 
            onClick={handleNext} 
            className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200 active:scale-95 transition-all hover:bg-indigo-500 hover:-translate-y-0.5"
          >
            <ArrowRight size={20} strokeWidth={2.5} />
          </button>
        ) : (
          <button 
            onClick={onFinish} 
            className="px-8 py-4 bg-emerald-500 text-white font-black rounded-2xl shadow-lg shadow-emerald-200 active:scale-95 transition-all text-xs tracking-widest hover:bg-emerald-400 hover:-translate-y-0.5"
          >
            FINISH
          </button>
        )}
      </div>
    </div>
  );
}
