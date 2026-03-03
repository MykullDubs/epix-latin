// src/components/LessonView.tsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  HelpCircle, CheckCircle2, X, Edit3, MessageSquare, 
  MessageCircle, ArrowLeft, ArrowRight, Info, Zap 
} from 'lucide-react';
import ConnectThreeVocab from './ConnectThreeVocab';

export interface LessonViewProps {
    lessonId?: string | null;
    lessons?: any[];
    lesson: any;
    onFinish: () => void;
    isInstructor?: boolean;
}

// ============================================================================
//  LESSON VIEW (Modern "Story" Style - Fully Interactive & Remote Synced)
// ============================================================================

// --- INTERNAL INTERACTIVE RENDERERS ---
const QuizBlockRenderer = ({ block }: any) => {
    // State now tracks the selected option ID, not the string/index
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // 1. LOCATE THE DATA
    const data = block?.content || block?.data || block || {};
    const question = data.question || "Missing Question Data";
    
    // 2. EXTRACT OPTIONS (Preserving the {id, text} structure)
    let options = data.options || [];
    if (!Array.isArray(options)) options = [];

    // Normalize options so they definitely have an id and text
    const normalizedOptions = options.map((opt: any, idx: number) => {
        if (typeof opt === 'string') {
            return { id: `opt_${idx}`, text: opt };
        }
        return {
            id: opt.id || `opt_${idx}`,
            text: opt.text || opt.label || opt.value || "Unknown Option"
        };
    });

    // 3. EXTRACT THE CORRECT ID
    let correctId = data.correctId;
    
    // Fallbacks just in case older lessons used a different format
    if (correctId === undefined) {
         if (data.correctIndex !== undefined) correctId = normalizedOptions[data.correctIndex]?.id;
         else if (data.correctAnswer) {
             const found = normalizedOptions.find((o:any) => o.text === data.correctAnswer);
             correctId = found?.id;
         }
    }

    // Ultimate fallback if data is somehow totally missing
    if (correctId === undefined && normalizedOptions.length > 0) {
        correctId = normalizedOptions[0].id;
    }

    // Is the currently selected ID the correct one?
    const isCorrect = selectedId === correctId;

    return (
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm my-6 relative overflow-hidden">
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
                    <p className="text-slate-400 font-bold italic p-4 text-center border-2 border-dashed rounded-2xl">No options provided.</p>
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
                                key={opt.id}
                                disabled={isSubmitted}
                                onClick={() => setSelectedId(opt.id)}
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

            {/* Submission & Feedback Controls */}
            {!isSubmitted && selectedId !== null ? (
                <button 
                    onClick={() => setIsSubmitted(true)}
                    className="mt-6 w-full py-4 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 active:scale-95 transition-all shadow-xl"
                >
                    Check Answer
                </button>
            ) : isSubmitted && (
                <div className={`mt-6 p-4 rounded-xl flex justify-between items-center animate-in zoom-in ${isCorrect ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                    <span className="font-bold flex items-center gap-2">
                        {isCorrect ? <><CheckCircle2 size={20}/> Correct!</> : <><X size={20}/> Incorrect</>}
                    </span>
                    {!isCorrect && (
                        <button 
                            onClick={() => { setIsSubmitted(false); setSelectedId(null); }} 
                            className="px-4 py-2 bg-white rounded-lg text-xs font-black uppercase tracking-widest shadow-sm hover:shadow active:scale-95 transition-all text-rose-600 border border-rose-200"
                        >
                            Try Again
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

const FillBlankBlockRenderer = ({ block }: any) => {
    // 1. LOCATE THE DATA (Safely)
    const data = block?.content || block?.data || block || {};
    const rawText = data.text || "Missing text [here].";
    
    // 2. EXTRACT BLANKS & CORRECT ANSWERS
    const { textParts, correctAnswers } = useMemo(() => {
        const parts = rawText.split(/\[.*?\]/g);
        const matches = Array.from(rawText.matchAll(/\[(.*?)\]/g));
        const answers = matches.map((m: any) => m[1]); 
        return { textParts: parts, correctAnswers: answers };
    }, [rawText]);

    // 3. EXTRACT DECOYS/OPTIONS (With crash protection!)
    const distractors = useMemo(() => {
        let rawOptions = data.options || data.distractors || [];
        if (!Array.isArray(rawOptions)) {
            rawOptions = typeof rawOptions === 'string' ? [rawOptions] : [];
        }
        return rawOptions.map((opt: any) => {
            if (typeof opt === 'string' || typeof opt === 'number') return String(opt);
            if (opt && typeof opt === 'object') return opt.text || opt.label || opt.value || "";
            return "";
        }).filter(Boolean); // Removes empty strings
    }, [data]);

    const [wordBank, setWordBank] = useState<string[]>([]);
    const [filledBlanks, setFilledBlanks] = useState<(string | null)[]>(Array(correctAnswers.length).fill(null));
    const [isChecked, setIsChecked] = useState(false);

    // 4. SHUFFLE EVERYTHING TOGETHER
    useEffect(() => {
        // Combine correct answers and distractors
        const allWords = Array.from(new Set([...correctAnswers, ...distractors]));
        setWordBank(allWords.sort(() => Math.random() - 0.5));
    }, [correctAnswers, distractors]);

    // Interactions
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
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm my-6">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shadow-inner">
                    <Edit3 size={20} />
                </div>
                <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Vocabulary Drill</h3>
            </div>

            {/* The Sentence */}
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

            {/* The Word Bank */}
            <div className="bg-slate-50 rounded-2xl p-6 border-2 border-slate-100 flex flex-wrap gap-3 min-h-[48px]">
                {wordBank.map((word, idx) => (
                    <button 
                        key={`bank-${idx}`}
                        onClick={() => handleBankClick(word)}
                        disabled={isChecked}
                        className="px-5 py-2.5 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:border-indigo-300 transition-all disabled:opacity-50"
                    >
                        {word}
                    </button>
                ))}
                {wordBank.length === 0 && !isChecked && (
                    <span className="text-slate-400 font-bold text-sm italic py-2">All words placed.</span>
                )}
            </div>

            {/* Submit Action */}
            {isComplete && !isChecked && (
                <button 
                    onClick={() => setIsChecked(true)}
                    className="mt-6 w-full py-4 bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 shadow-lg shadow-emerald-100 active:scale-95 transition-all"
                >
                    Check Answers
                </button>
            )}
        </div>
    );
};

const ScenarioBlockRenderer = ({ block }: any) => {
    const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
    
    // Robust Data Extraction
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
                <p className="text-slate-300 font-medium leading-relaxed mb-8 italic">
                    "{context}"
                </p>

                <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">How do you respond?</p>
                    {options.length === 0 ? (
                        <p className="text-rose-400 font-bold italic text-sm">No scenario options provided.</p>
                    ) : (
                        options.map((opt: string, i: number) => (
                            <button 
                                key={i} 
                                onClick={() => setSelectedOpt(opt)}
                                className={`w-full p-4 border rounded-2xl text-left font-bold text-sm transition-all active:scale-[0.98] ${
                                    selectedOpt === opt 
                                        ? 'bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-500/20' 
                                        : 'bg-white/10 hover:bg-white/20 border-white/10'
                                }`}
                            >
                                {opt}
                            </button>
                        ))
                    )}
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

  // --- AUTOMATIC VOCABULARY EXTRACTOR ---
  const lessonVocab = useMemo(() => {
    return lesson?.blocks
      ?.filter((b: any) => b.type === 'vocab-list')
      ?.flatMap((b: any) => b.items) || [];
  }, [lesson]);

  // --- CRITICAL FIX: PAGINATION LOGIC ---
  const pages = useMemo(() => {
    if (!lesson?.blocks) return [];
    const grouped: any[] = [];
    let buffer: any[] = [];
    lesson.blocks.forEach((b: any) => {
      // Isolating interactive blocks into their own pages
      if (['quiz', 'flashcard', 'scenario', 'fill-blank', 'discussion', 'game'].includes(b.type)) {
        if (buffer.length > 0) grouped.push({ type: 'read', blocks: [...buffer] });
        grouped.push({ type: 'interact', blocks: [b] });
        buffer = [];
      } else { buffer.push(b); }
    });
    if (buffer.length > 0) grouped.push({ type: 'read', blocks: [...buffer] });
    return grouped;
  }, [lesson]);

  // --- THE SYNC ENGINE ---
  const syncToProjector = useCallback((newIdx: number) => {
    if (!isInstructor) return;
    const syncId = lesson.originalId || lesson.id;
    setDoc(doc(db, 'live_sessions', syncId), {
      activePageIdx: newIdx,
      liveBlockState: null, 
      lastUpdate: Date.now()
    }, { merge: true }).catch(console.error);
  }, [lesson, isInstructor]);

  const handleLiveInteraction = useCallback((state: any) => {
    if (!isInstructor) return;
    const syncId = lesson.originalId || lesson.id;
    setDoc(doc(db, 'live_sessions', syncId), {
      liveBlockState: state,
      lastUpdate: Date.now()
    }, { merge: true }).catch(console.error);
  }, [lesson, isInstructor]);

  useEffect(() => {
    if (isInstructor) syncToProjector(0);
  }, [isInstructor, syncToProjector]);

  // --- THROTTLED SCROLL SYNC ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isInstructor) return;
    
    const handleScroll = () => {
      if (scrollTimeout.current) return; 
      
      scrollTimeout.current = setTimeout(() => {
        const scrollPercent = container.scrollTop / (container.scrollHeight - container.clientHeight);
        const syncId = lesson.originalId || lesson.id;
        
        setDoc(doc(db, 'live_sessions', syncId), {
          scrollPercent: scrollPercent || 0,
          lastUpdate: Date.now()
        }, { merge: true }).catch(e => {});
        
        scrollTimeout.current = null;
      }, 50); 
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [lesson, isInstructor]);

  // --- NAVIGATION HANDLERS ---
  const handlePrev = () => {
      const newIdx = Math.max(0, activePageIdx - 1);
      setActivePageIdx(newIdx);
      syncToProjector(newIdx);
      containerRef.current?.scrollTo(0,0);
  };

  const handleNext = () => {
      if (activePageIdx < pages.length - 1) {
          const newIdx = activePageIdx + 1;
          setActivePageIdx(newIdx);
          syncToProjector(newIdx); 
          containerRef.current?.scrollTo(0,0);
      } else {
          onFinish();
      }
  };

 // --- MASTER BLOCK RENDERER ---
  const renderBlock = (block: any, idx: number) => {
    const blockKey = `page_${activePageIdx}_block_${idx}`;

    switch (block.type) {
      
      // --- UPGRADED TYPOGRAPHY BLOCKS ---
      case 'text':
        return (
          <div key={blockKey} className="py-10 animate-in fade-in slide-in-from-bottom-3 duration-700">
            {block.title && (
                <span className="inline-block px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                    {block.title}
                </span>
            )}
            <p className="text-4xl md:text-5xl font-black text-slate-900 leading-[1.1] tracking-tight">{block.content}</p>
          </div>
        );

      case 'essay':
        return (
          <div key={blockKey} className="py-6 space-y-10 animate-in fade-in">
            {block.title && (
                <h2 className="text-3xl font-black text-slate-900 border-l-[6px] border-indigo-600 pl-6 py-1 tracking-tight">
                    {block.title}
                </h2>
            )}
            <div className="space-y-8">
              {block.content?.split('\n\n').map((p: string, j: number) => (
                <p key={j} className="text-xl text-slate-600 font-serif leading-relaxed text-justify first-letter:text-6xl first-letter:font-black first-letter:text-slate-900 first-letter:mr-3 first-letter:float-left first-letter:leading-none">
                  {p.trim()}
                </p>
              ))}
            </div>
          </div>
        );

      case 'callout':
        return (
          <div key={blockKey} className="my-10 p-8 rounded-[2.5rem] bg-amber-50 border-2 border-amber-100 relative overflow-hidden group shadow-sm">
            <Zap size={100} className="absolute -right-6 -top-6 text-amber-200/40 rotate-12 group-hover:scale-110 transition-transform" fill="currentColor" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-amber-500 text-white rounded-lg shadow-sm"><Info size={16} strokeWidth={3} /></div>
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{block.label || 'Grammar Spotlight'}</span>
              </div>
              <p className="text-lg text-slate-800 font-bold leading-relaxed italic pr-12">"{block.content}"</p>
            </div>
          </div>
        );

      case 'dialogue':
        return (
          <div key={blockKey} className="py-8 space-y-6">
            {block.lines?.map((line: any, j: number) => (
              <div key={j} className={`flex items-end gap-3 ${line.side === 'right' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black text-white shrink-0 shadow-md ${line.side === 'right' ? 'bg-indigo-600' : 'bg-slate-800'}`}>{line.speaker?.[0].toUpperCase()}</div>
                <div className={`max-w-[85%] p-5 rounded-[2rem] text-base font-medium leading-relaxed ${line.side === 'right' ? 'bg-indigo-500 text-white rounded-br-none' : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none shadow-sm'}`}>
                  {line.text}
                  {line.translation && <p className={`text-xs mt-3 italic opacity-60 font-bold border-t pt-3 ${line.side === 'right' ? 'border-white/20' : 'border-slate-100'}`}>{line.translation}</p>}
                </div>
              </div>
            ))}
          </div>
        );

      case 'vocab-list':
        return (
          <div key={blockKey} className="py-6 grid grid-cols-1 gap-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2">Lexicon</h3>
            {block.items?.map((item: any, j: number) => (
              <div key={j} className="bg-white p-6 rounded-[2rem] border-2 border-slate-50 shadow-sm flex flex-col gap-1 hover:border-indigo-200 transition-all hover:-translate-y-0.5">
                <span className="text-xl font-black text-indigo-600 tracking-tight">{item.term}</span>
                <div className="h-0.5 w-12 bg-slate-100 my-2" />
                <span className="text-sm font-bold text-slate-500 leading-relaxed">{item.definition}</span>
              </div>
            ))}
          </div>
        );

      case 'image':
        return (
          <div key={blockKey} className="py-8 animate-in fade-in">
             <div className="rounded-3xl overflow-hidden shadow-lg border border-slate-100"><img src={block.url} alt="Lesson visual" className="w-full h-auto object-cover max-h-64" /></div>
             {block.caption && <p className="text-xs font-bold text-slate-400 text-center mt-4 px-4 uppercase tracking-widest">{block.caption}</p>}
          </div>
        );

      case 'discussion':
        return (
          <div key={blockKey} className="py-8 animate-in fade-in">
            <div className="bg-indigo-50 border-2 border-indigo-100 rounded-[2.5rem] p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-md"><MessageCircle size={24} /></div>
                  <h3 className="text-2xl font-black text-indigo-900">{block.title || "Discussion"}</h3>
              </div>
              <div className="space-y-4">
                {(block.questions || []).map((q: string, qIdx: number) => (
                  <div key={qIdx} className="bg-white p-5 rounded-2xl shadow-sm border border-indigo-50 flex gap-4 items-start">
                      <span className="text-indigo-300 font-black text-xl leading-none mt-0.5">{qIdx + 1}</span>
                      <p className="text-slate-700 font-bold leading-relaxed">{q}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      // --- INTERACTIVE BLOCKS ---
      case 'quiz':
        return <div key={blockKey} className="animate-in slide-in-from-bottom-4 fade-in"><QuizBlockRenderer block={block} /></div>;
      
      case 'fill-blank':
        return <div key={blockKey} className="animate-in slide-in-from-bottom-4 fade-in"><FillBlankBlockRenderer block={block} /></div>;
      
      case 'scenario':
        return <div key={blockKey} className="animate-in slide-in-from-bottom-4 fade-in"><ScenarioBlockRenderer block={block} /></div>;

      case 'game':
        if (block.gameType === 'connect-three') {
            return (
                <div key={blockKey} className="py-8 animate-in fade-in slide-in-from-bottom-4 flex flex-col items-center">
                    <div className="text-center mb-6">
                        <h3 className="text-2xl font-black text-slate-800">{block.title || "Vocabulary Battle"}</h3>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Game Active on Projector</p>
                    </div>
                    {/* Assuming ConnectThreeVocab is imported and available! */}
                    {/* <div className="scale-90 origin-top">
                        <ConnectThreeVocab vocabList={lessonVocab} />
                    </div> */}
                    <div className="w-full h-64 bg-amber-50 rounded-[2.5rem] border-2 border-amber-200 flex items-center justify-center text-amber-500 font-black shadow-inner">
                        [Game Rendered Here]
                    </div>
                </div>
            );
        }
        return <div key={blockKey} className="text-rose-500">Unknown Game Type</div>;

      default:
        return <div key={blockKey} className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center text-xs text-slate-400 font-bold uppercase tracking-widest my-4">Unsupported Module: {block.type}</div>;
    }
  };

  if (!pages[activePageIdx]) return null;

  return (
    <div className="flex flex-col h-full bg-slate-50/30 overflow-hidden font-sans relative">
      <div className="px-6 md:px-8 pt-10 md:pt-14 pb-6 bg-white border-b border-slate-100 shrink-0 shadow-sm relative z-10">
        <div className="flex justify-between items-end">
          <div>
              <h1 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] mb-1">{lesson.title}</h1>
              <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none">Current Session</p>
          </div>
          {isInstructor && (
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-black text-emerald-600 uppercase">Synced</span>
            </div>
          )}
        </div>
      </div>
      
      <div ref={containerRef} className="flex-1 overflow-y-auto px-6 md:px-10 py-10 pb-48 custom-scrollbar scroll-smooth relative z-0">
        <div className="max-w-xl mx-auto space-y-4">
          {pages[activePageIdx].blocks.map((block: any, i: number) => renderBlock(block, i))}
        </div>
      </div>
      
      <div className="p-8 pb-10 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex justify-between items-center fixed bottom-0 left-0 right-0 z-50 shadow-[0_-20px_40px_rgba(0,0,0,0.05)]">
        <button 
            onClick={handlePrev} 
            className="p-5 bg-slate-100 text-slate-400 rounded-3xl disabled:opacity-20 active:scale-90 transition-all hover:bg-slate-200" 
            disabled={activePageIdx === 0}
        >
            <ArrowLeft size={24} strokeWidth={3} />
        </button>
        
        <div className="text-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Unit Page</span>
            <span className="text-2xl font-black text-slate-900">{activePageIdx + 1} <span className="text-slate-300">/</span> {pages.length}</span>
        </div>
        
        {activePageIdx < pages.length - 1 ? (
          <button 
            onClick={handleNext} 
            className="p-5 bg-indigo-600 text-white rounded-3xl shadow-xl shadow-indigo-200 active:scale-90 transition-all hover:bg-indigo-500 hover:-translate-y-1"
          >
            <ArrowRight size={24} strokeWidth={3} />
          </button>
        ) : (
          <button 
            onClick={onFinish} 
            className="px-10 py-5 bg-emerald-500 text-white font-black rounded-3xl shadow-xl shadow-emerald-200 active:scale-95 transition-all text-xs tracking-widest hover:bg-emerald-400 hover:-translate-y-1"
          >
            FINISH
          </button>
        )}
      </div>
    </div>
  );
}
