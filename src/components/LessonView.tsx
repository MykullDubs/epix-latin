// src/components/LessonView.tsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  HelpCircle, CheckCircle2, X, Edit3, MessageSquare, 
  MessageCircle, ArrowLeft, ArrowRight, Info, Zap 
} from 'lucide-react';
// import ConnectThreeVocab from './ConnectThreeVocab';

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
    const question = data.question || "Missing Question Data";
    
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
    const rawText = data.text || "Missing text [here].";
    
    const { textParts, correctAnswers } = useMemo(() => {
        const parts = rawText.split(/\[.*?\]/g);
        const matches = Array.from(rawText.matchAll(/\[(.*?)\]/g));
        const answers = matches.map((m: any) => m[1]); 
        return { textParts: parts, correctAnswers: answers };
    }, [rawText]);

    const distractors = useMemo(() => {
        let rawOptions = data.options || data.distractors || [];
        if (!Array.isArray(rawOptions)) rawOptions = typeof rawOptions === 'string' ? [rawOptions] : [];
        return rawOptions.map((opt: any) => {
            if (typeof opt === 'string' || typeof opt === 'number') return String(opt);
            if (opt && typeof opt === 'object') return opt.text || opt.label || opt.value || "";
            return "";
        }).filter(Boolean);
    }, [data]);

    const [wordBank, setWordBank] = useState<string[]>([]);
    const [filledBlanks, setFilledBlanks] = useState<(string | null)[]>(Array(correctAnswers.length).fill(null));
    const [isChecked, setIsChecked] = useState(false);

    useEffect(() => {
        const allWords = Array.from(new Set([...correctAnswers, ...distractors]));
        setWordBank(allWords.sort(() => Math.random() - 0.5));
    }, [correctAnswers, distractors]);

    const handleBankClick = (word: string) => {
        if (isChecked) return;
        const firstEmptyIdx = filledBlanks.indexOf(null);
        if (firstEmptyIdx !== -1) {
            const newFilled = [...filledBlanks];
            newFilled[firstEmptyIdx] = word;
            setFilledBlanks(newFilled);
            
            const wordIdx = wordBank.indexOf(word);
            const newBank = [...wordBank];
            newBank.splice(wordIdx, 1);
            setWordBank(newBank);
        }
    };

    const handleBlankClick = (word: string | null, idx: number) => {
        if (isChecked || !word) return;
        const newFilled = [...filledBlanks];
        newFilled[idx] = null;
        setFilledBlanks(newFilled);
        setWordBank([...wordBank, word]);
    };

    const isComplete = filledBlanks.every(slot => slot !== null);

    return (
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm my-6">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shadow-inner">
                    <Edit3 size={20} />
                </div>
                <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Vocabulary Drill</h3>
            </div>

            <div className="text-xl font-medium text-slate-700 leading-loose flex flex-wrap items-center gap-y-4 mb-10">
                {textParts.map((part: string, i: number) => {
                    const isLast = i === textParts.length - 1;
                    const filledWord = filledBlanks[i];
                    
                    let blankStyle = "min-w-[80px] h-10 border-b-4 border-slate-200 mx-2 flex items-center justify-center px-4 cursor-pointer transition-all";
                    if (filledWord) blankStyle = "min-w-[80px] h-10 bg-indigo-100 text-indigo-700 font-bold rounded-xl mx-2 flex items-center justify-center px-4 cursor-pointer shadow-sm hover:bg-rose-100 hover:text-rose-600 transition-all active:scale-95";
                    
                    if (isChecked && filledWord) {
                        const isCorrect = filledWord === correctAnswers[i];
                        blankStyle = `min-w-[80px] h-10 font-bold rounded-xl mx-2 flex items-center justify-center px-4 shadow-sm text-white ${isCorrect ? 'bg-emerald-500' : 'bg-rose-500'}`;
                    }

                    return (
                        <React.Fragment key={i}>
                            <span className="leading-none">{part}</span>
                            {!isLast && (
                                <div onClick={() => handleBlankClick(filledWord, i)} className={blankStyle}>
                                    {filledWord || ""}
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border-2 border-slate-100 flex flex-wrap gap-3 min-h-[48px]">
                {wordBank.map((word, idx) => (
                    <button 
                        key={`bank-${idx}`} onClick={() => handleBankClick(word)} disabled={isChecked}
                        className="px-5 py-2.5 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:border-indigo-300 transition-all disabled:opacity-50"
                    >
                        {word}
                    </button>
                ))}
            </div>

            {isComplete && !isChecked && (
                <button onClick={() => setIsChecked(true)} className="mt-6 w-full py-4 bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 shadow-lg shadow-emerald-100 active:scale-95 transition-all">
                    Check Answers
                </button>
            )}
        </div>
    );
};

const ScenarioBlockRenderer = ({ block }: any) => {
    const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
    const title = block.title || block?.content?.title || block?.data?.title || "Real-World Scenario";
    const context = block.context || block?.content?.context || block?.data?.context || "Scenario context goes here...";
    const options = block.options || block?.content?.options || block?.data?.options || [];
    
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
                            {opt}
                        </button>
                    ))}
                </div>
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

  const lessonVocab = useMemo(() => {
    return lesson?.blocks?.filter((b: any) => b.type === 'vocab-list')?.flatMap((b: any) => b.items) || [];
  }, [lesson]);

  const pages = useMemo(() => {
    if (!lesson?.blocks) return [];
    const grouped: any[] = [];
    let buffer: any[] = [];
    lesson.blocks.forEach((b: any) => {
      if (['quiz', 'flashcard', 'scenario', 'fill-blank', 'discussion', 'game'].includes(b.type)) {
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

  // --- NEW: Keyboard Navigation ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Prevent triggering if user is typing in an input or textarea
        if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
        
        if (e.key === 'ArrowRight') {
            if (activePageIdx < pages.length - 1) handleNext();
        } else if (e.key === 'ArrowLeft') {
            if (activePageIdx > 0) handlePrev();
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

  // --- THE MELLOWED BLOCK RENDERER ---
  const renderBlock = (block: any, idx: number) => {
    const blockKey = `page_${activePageIdx}_block_${idx}`;

    switch (block.type) {
      
      case 'text':
        return (
          <div key={blockKey} className="py-6 animate-in fade-in slide-in-from-bottom-3 duration-700">
            {block.title && (
                <span className="inline-block px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                    {block.title}
                </span>
            )}
            <p className="text-2xl md:text-3xl font-bold text-slate-700 leading-snug tracking-tight">
              {block.content}
            </p>
          </div>
        );

      case 'essay':
        return (
          <div key={blockKey} className="py-4 space-y-6 animate-in fade-in">
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                {block.title && (
                    <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-50">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                            <BookOpen size={18} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                            {block.title}
                        </h3>
                    </div>
                )}
                <div className="text-slate-600 font-medium text-base md:text-lg leading-relaxed space-y-6 tracking-wide">
                    {block.content?.split('\n').map((p: string, j: number) => {
                        if (!p.trim()) return null;
                        return <p key={j}>{p}</p>;
                    })}
                </div>
            </div>
          </div>
        );

      case 'callout':
        return (
          <div key={blockKey} className="my-8 p-8 rounded-[2.5rem] bg-amber-50 border border-amber-100 relative overflow-hidden group shadow-sm">
            <Zap size={100} className="absolute -right-6 -top-6 text-amber-200/40 rotate-12 group-hover:scale-110 transition-transform" fill="currentColor" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-amber-500 text-white rounded-lg shadow-sm"><Info size={16} strokeWidth={3} /></div>
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{block.label || 'Spotlight'}</span>
              </div>
              <p className="text-lg text-slate-700 font-bold leading-relaxed italic pr-12">"{block.content}"</p>
            </div>
          </div>
        );

      case 'dialogue':
        return (
          <div key={blockKey} className="py-6 space-y-6">
            {block.lines?.map((line: any, j: number) => (
              <div key={j} className={`flex items-end gap-3 ${line.side === 'right' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black text-white shrink-0 shadow-md ${line.side === 'right' ? 'bg-indigo-500' : 'bg-slate-300'}`}>{line.speaker?.[0].toUpperCase()}</div>
                <div className={`max-w-[85%] p-5 rounded-[2rem] text-base font-medium leading-relaxed ${line.side === 'right' ? 'bg-indigo-50 text-indigo-900 border border-indigo-100 rounded-br-none' : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none shadow-sm'}`}>
                  {line.text}
                  {line.translation && <p className={`text-xs mt-3 italic opacity-70 font-bold border-t pt-3 ${line.side === 'right' ? 'border-indigo-200' : 'border-slate-100'}`}>{line.translation}</p>}
                </div>
              </div>
            ))}
          </div>
        );

      case 'vocab-list':
        return (
          <div key={blockKey} className="py-6 grid grid-cols-1 gap-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2 pl-2">Lexicon</h3>
            {block.items?.map((item: any, j: number) => (
              <div key={j} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 hover:border-indigo-200 transition-all">
                <span className="text-lg font-bold text-indigo-600 tracking-tight min-w-[100px]">{item.term}</span>
                <div className="h-6 w-px bg-slate-200" />
                <span className="text-sm font-medium text-slate-600 flex-1">{item.definition}</span>
              </div>
            ))}
          </div>
        );

      case 'image':
        return (
          <div key={blockKey} className="py-8 animate-in fade-in">
             <div className="rounded-[2.5rem] overflow-hidden shadow-md border border-slate-100"><img src={block.url} alt="Lesson visual" className="w-full h-auto object-cover max-h-80" /></div>
             {block.caption && <p className="text-xs font-bold text-slate-400 text-center mt-4 px-4 uppercase tracking-widest">{block.caption}</p>}
          </div>
        );

      case 'discussion':
        return (
          <div key={blockKey} className="py-8 animate-in fade-in">
            <div className="bg-indigo-50 border border-indigo-100 rounded-[2.5rem] p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-indigo-500 text-white rounded-xl shadow-md"><MessageCircle size={20} /></div>
                  <h3 className="text-xl font-bold text-indigo-900">{block.title || "Discussion"}</h3>
              </div>
              <div className="space-y-4">
                {(block.questions || []).map((q: string, qIdx: number) => (
                  <div key={qIdx} className="bg-white p-5 rounded-2xl shadow-sm border border-indigo-50 flex gap-4 items-start">
                      <span className="text-indigo-300 font-black text-lg leading-none mt-1">{qIdx + 1}</span>
                      <p className="text-slate-600 font-medium leading-relaxed">{q}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 'quiz': return <div key={blockKey} className="animate-in slide-in-from-bottom-4 fade-in"><QuizBlockRenderer block={block} /></div>;
      case 'fill-blank': return <div key={blockKey} className="animate-in slide-in-from-bottom-4 fade-in"><FillBlankBlockRenderer block={block} /></div>;
      case 'scenario': return <div key={blockKey} className="animate-in slide-in-from-bottom-4 fade-in"><ScenarioBlockRenderer block={block} /></div>;
      case 'game':
        if (block.gameType === 'connect-three') {
            return (
                <div key={blockKey} className="py-8 animate-in fade-in slide-in-from-bottom-4 flex flex-col items-center">
                    <div className="text-center mb-6">
                        <h3 className="text-2xl font-black text-slate-800">{block.title || "Vocabulary Battle"}</h3>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Game Active on Projector</p>
                    </div>
                    <div className="w-full h-64 bg-amber-50 rounded-[2.5rem] border border-amber-200 flex items-center justify-center text-amber-500 font-bold shadow-inner">
                        [Interactive Game View]
                    </div>
                </div>
            );
        }
        return <div key={blockKey} className="text-rose-500">Unknown Game Type</div>;

      default:
        return <div key={blockKey} className="p-8 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200 text-center text-xs text-slate-400 font-bold uppercase tracking-widest my-4">Unsupported Module: {block.type}</div>;
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
              <h1 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] mb-1">{lesson.title}</h1>
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
      
      {/* MAIN CONTENT (Reduced bottom padding) */}
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
