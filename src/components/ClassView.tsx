// src/components/ClassView.tsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore'; 
import { db } from '../config/firebase';
import { useLiveClass } from '../hooks/useLiveClass';
import { MessageSquare, MessageCircle, Gamepad2, CheckCircle2, X, Puzzle, ChevronLeft, ChevronRight, Zap, Users } from 'lucide-react';
import ConnectThreeVocab from './ConnectThreeVocab';
// import ClassForum from './ClassForum'; // Ensure this exists

// ============================================================================
//  CLASS VIEW (The Projector / Big Screen Mode with Keyboard Nav)
// ============================================================================
export default function ClassView({ lesson, classId, userData, activeOrg, onExit }: any) {
  const [activePageIdx, setActivePageIdx] = useState(0);
  const [showForum, setShowForum] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  // Initialize the Instructor Live Game Sync Engine
  const { liveState, startLiveClass, endLiveClass, changeSlide, triggerQuiz } = useLiveClass(classId, true);

  const lessonVocab = useMemo(() => {
    return lesson?.blocks
      ?.filter((b: any) => b.type === 'vocab-list')
      ?.flatMap((b: any) => b.items) || [];
  }, [lesson]);

  // When the projector starts, broadcast to the room!
  useEffect(() => {
      startLiveClass(lesson.id);
      return () => { endLiveClass(); }; // Kill the session when teacher closes it
  }, [lesson.id]);

  const pages = useMemo(() => {
    if (!lesson?.blocks) return [];
    const grouped: any[] = [];
    let buffer: any[] = [];
    lesson.blocks.forEach((b: any) => {
      // Isolate interactive blocks so they get their own full-screen page
      if (['quiz', 'flashcard', 'scenario', 'fill-blank', 'discussion', 'game'].includes(b.type)) {
        if (buffer.length > 0) grouped.push({ type: 'read', blocks: [...buffer] });
        grouped.push({ type: 'interact', blocks: [b] });
        buffer = [];
      } else { buffer.push(b); }
    });
    if (buffer.length > 0) grouped.push({ type: 'read', blocks: [...buffer] });
    return grouped;
  }, [lesson]);

  // KEYBOARD NAVIGATION LISTENER
  const handleNext = useCallback(() => {
      if (activePageIdx < pages.length - 1) {
          const nextIdx = activePageIdx + 1;
          setActivePageIdx(nextIdx);
          changeSlide(nextIdx); // Broadcast page change to student phones
          if (stageRef.current) stageRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
  }, [activePageIdx, pages.length, changeSlide]);

  const handlePrev = useCallback(() => {
      if (activePageIdx > 0) {
          const prevIdx = activePageIdx - 1;
          setActivePageIdx(prevIdx);
          changeSlide(prevIdx); // Broadcast page change to student phones
          if (stageRef.current) stageRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
  }, [activePageIdx, changeSlide]);

  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
          
          if (e.key === 'ArrowRight' || e.key === ' ') { 
              e.preventDefault();
              handleNext();
          } else if (e.key === 'ArrowLeft') {
              e.preventDefault();
              handlePrev();
          } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              if (stageRef.current) stageRef.current.scrollBy({ top: window.innerHeight * 0.4, behavior: 'smooth' });
          } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              if (stageRef.current) stageRef.current.scrollBy({ top: -(window.innerHeight * 0.4), behavior: 'smooth' });
          }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  if (!lesson || !pages[activePageIdx]) return null;

  return (
    <div className="h-screen w-screen bg-slate-900 text-white fixed inset-0 z-[5000] flex flex-col overflow-hidden font-sans selection:bg-indigo-500">
      
      {/* HEADER CONTROLS (Replacing default app header) */}
      <header className="h-16 px-6 flex justify-between items-center border-b border-white/10 shrink-0" style={{ backgroundColor: activeOrg?.themeColor || '#4f46e5' }}>
        <span className="font-black text-white uppercase tracking-widest flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
            {activeOrg?.name || 'Magister'} | CLASE EN VIVO
        </span>
        <button onClick={onExit} className="bg-black/20 hover:bg-rose-600 text-white px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-white">
            Terminar Clase
        </button>
      </header>

      <main className="flex-1 flex overflow-hidden relative group/canvas bg-white text-slate-900">
        
        {/* MOUSE NAVIGATION CONTROLS */}
        {activePageIdx > 0 && (
            <button 
                onClick={handlePrev} 
                aria-label="Previous Slide"
                className="absolute left-8 top-1/2 -translate-y-1/2 z-50 p-6 bg-slate-900/10 hover:bg-slate-900 text-slate-800 hover:text-white rounded-full backdrop-blur-md opacity-0 group-hover/canvas:opacity-100 transition-all duration-300 hover:scale-110 focus:outline-none shadow-lg"
            >
                <ChevronLeft size={48} aria-hidden="true" />
            </button>
        )}
        
        {activePageIdx < pages.length - 1 && (
            <button 
                onClick={handleNext} 
                aria-label="Next Slide"
                className="absolute right-8 top-1/2 -translate-y-1/2 z-50 p-6 bg-slate-900/10 hover:bg-slate-900 text-slate-800 hover:text-white rounded-full backdrop-blur-md opacity-0 group-hover/canvas:opacity-100 transition-all duration-300 hover:scale-110 focus:outline-none shadow-lg"
            >
                <ChevronRight size={48} aria-hidden="true" />
            </button>
        )}

        <div ref={stageRef} className={`flex-1 overflow-y-auto px-16 py-12 flex flex-col items-center justify-center transition-all duration-500 ${showForum ? 'mr-[450px]' : ''}`}>
          <div className="w-full max-w-7xl space-y-20">
            {pages[activePageIdx].blocks.map((block: any, i: number) => {
              const isQuiz = block.type === 'quiz';
              const answerCount = Object.keys(liveState?.answers || {}).length;

              return (
                <div key={i} className="animate-in fade-in zoom-in-95 duration-700 w-full">
                  
                  {/* MULTIPLAYER QUIZ BLOCK INTERCEPTOR */}
                  {isQuiz ? (
                    <div className="bg-slate-900 text-white border-4 border-slate-800 rounded-[4rem] p-16 shadow-2xl text-center animate-in slide-in-from-bottom-12 duration-500 mx-auto max-w-5xl">
                        <span className="text-[2vh] font-black text-indigo-400 uppercase tracking-widest block mb-6">Class Question</span>
                        <h2 className="text-[5vh] md:text-[6vh] font-black mb-12 leading-tight">{block.content?.question || block.question}</h2>
                        
                        {/* State 1: Waiting to Start */}
                        {liveState?.quizState === 'waiting' && (
                            <button 
                                onClick={() => triggerQuiz('active')}
                                className="bg-rose-500 hover:bg-rose-600 text-white px-12 py-6 rounded-full font-black text-[3vh] uppercase tracking-widest shadow-[0_0_40px_rgba(244,63,94,0.5)] transition-transform active:scale-95 flex items-center gap-4 mx-auto focus:outline-none focus:ring-4 focus:ring-rose-400"
                            >
                                <Zap size={40} fill="currentColor" /> Launch Trivia Protocol
                            </button>
                        )}

                        {/* State 2: Active Game (Waiting for answers) */}
                        {liveState?.quizState === 'active' && (
                            <div className="space-y-12 animate-in fade-in duration-500">
                                <div className="flex flex-col items-center justify-center gap-4 text-[6vh] font-black text-indigo-400">
                                    <div className="flex items-center gap-6 bg-slate-800 px-10 py-6 rounded-[2rem] shadow-inner border border-slate-700">
                                        <Users size={64} className="animate-pulse" /> 
                                        <span>{answerCount} Students Locked In</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => triggerQuiz('revealed')}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-12 py-6 rounded-full font-black text-[3vh] uppercase tracking-widest transition-transform active:scale-95 shadow-xl mx-auto focus:outline-none focus:ring-4 focus:ring-indigo-400"
                                >
                                    Reveal Correct Answer
                                </button>
                            </div>
                        )}

                        {/* State 3: The Reveal (Shows Correct Answer) */}
                        {liveState?.quizState === 'revealed' && (
                            <div className="animate-in zoom-in duration-500 flex flex-col items-center">
                                <div className="inline-flex items-center gap-4 bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/50 px-10 py-5 rounded-[2rem] text-[4vh] font-black mb-12 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                                    <CheckCircle2 size={48} /> Correct Answer Displayed!
                                </div>
                                
                                {/* Show the correct answer prominently */}
                                <div className="bg-emerald-500 text-white p-8 rounded-[2rem] shadow-xl text-[4vh] font-bold border-4 border-emerald-400 min-w-[50%]">
                                    {block.content?.options?.find((o:any) => o.id === block.content.correctId)?.text || "Answer Revealed on Devices"}
                                </div>
                            </div>
                        )}
                    </div>
                  ) : (
                    /* STANDARD BLOCKS */
                    <>
                        {block.type === 'text' && <TextBlock block={block} />}
                        {block.type === 'essay' && <EssayBlock block={block} />}
                        {block.type === 'image' && <ImageBlock block={block} />}
                        {block.type === 'dialogue' && <DialogueBlock block={block} />}
                        {block.type === 'vocab-list' && <VocabListBlock block={block} />}
                        {block.type === 'discussion' && <DiscussionBlock block={block} />}
                        {block.type === 'game' && block.gameType === 'connect-three' && <GameBlock block={block} lessonVocab={lessonVocab} />}
                        {block.type === 'scenario' && <ScenarioBlock block={block} liveState={liveState} />}
                        {block.type === 'fill-blank' && <FillBlankBlock block={block} liveState={liveState} />}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* FORUM DRAWER */}
        {showForum && (
          <aside className="absolute right-0 top-0 bottom-0 w-[450px] bg-slate-50 border-l border-slate-200 p-8 z-10 animate-in slide-in-from-right shadow-2xl">
             <h3 className="text-2xl font-black mb-6 flex items-center gap-2"><MessageSquare className="text-indigo-600" aria-hidden="true"/> FORUM</h3>
             {classId ? <p className="text-slate-400">Forum Component Here</p> : <p className="text-slate-400">Class chat unavailable.</p>}
          </aside>
        )}
      </main>

      {/* FOOTER PROGRESS INDICATOR */}
      <footer className="h-20 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-12 shrink-0">
          <div className="flex items-center gap-6">
              <h2 className="text-xl font-black text-slate-500 uppercase tracking-widest">{lesson.title}</h2>
          </div>
          <div className="flex items-center gap-6">
              <div className="w-48 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${((activePageIdx + 1) / pages.length) * 100}%` }} />
              </div>
              <span className="font-black text-slate-400 tracking-widest uppercase">
                  Slide {activePageIdx + 1} of {pages.length}
              </span>
          </div>
      </footer>
    </div>
  );
}

// ============================================================================
//  INTERNAL BLOCK RENDERERS (Keeps main component clean)
// ============================================================================

const TextBlock = ({ block }: { block: any }) => (
  <div className="text-center">
    {block.title && <h3 className="text-[3vh] font-black text-indigo-500 uppercase tracking-widest mb-6">{block.title}</h3>}
    <p className="text-[6vh] font-bold text-slate-800 leading-tight">{block.content}</p>
  </div>
);

const EssayBlock = ({ block }: { block: any }) => (
  <div className="w-full max-w-5xl mx-auto space-y-[4vh]">
    <h1 className="text-[8vh] font-black text-slate-900 leading-none mb-12 text-center">{block.title}</h1>
    {block.content?.split('\n\n').map((para: string, pIdx: number) => (
      <p key={pIdx} className="text-[4vh] leading-[1.6] text-slate-700 font-serif text-justify first-letter:text-[6vh] first-letter:font-black first-letter:text-indigo-600 first-letter:mr-3">{para.trim()}</p>
    ))}
  </div>
);

const ImageBlock = ({ block }: { block: any }) => (
  <figure className="w-full flex flex-col items-center">
    <img src={block.url} alt="presentation slide" className="max-h-[60vh] rounded-[3rem] shadow-2xl object-cover border-8 border-slate-50" />
    {block.caption && <figcaption className="text-[3vh] text-slate-500 font-bold mt-8 text-center max-w-4xl">{block.caption}</figcaption>}
  </figure>
);

const DialogueBlock = ({ block }: { block: any }) => (
  <div className="w-full max-w-5xl mx-auto space-y-12">
    {block.lines?.map((line: any, j: number) => (
      <div key={j} className={`flex items-end gap-6 ${line.side === 'right' ? 'flex-row-reverse' : ''}`}>
        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-[3vh] font-black text-white shrink-0 shadow-2xl ${line.side === 'right' ? 'bg-indigo-600' : 'bg-slate-800'}`}>
          {line.speaker?.[0].toUpperCase()}
        </div>
        <div className={`max-w-[80%] p-10 rounded-[3rem] shadow-lg text-[4vh] font-medium leading-relaxed ${line.side === 'right' ? 'bg-indigo-500 text-white rounded-br-none' : 'bg-white border-4 border-slate-100 text-slate-800 rounded-bl-none'}`}>
          {line.text}
          {line.translation && (
            <p className={`text-[2.5vh] mt-6 italic opacity-80 font-bold border-t pt-4 ${line.side === 'right' ? 'border-indigo-400' : 'border-slate-200'}`}>{line.translation}</p>
          )}
        </div>
      </div>
    ))}
  </div>
);

const VocabListBlock = ({ block }: { block: any }) => (
  <div className="grid grid-cols-2 gap-8">
    {block.items.map((item: any, j: number) => (
      <div key={j} className="bg-slate-50 p-12 rounded-[3rem] border-4 border-slate-100 text-center shadow-xl">
        <p className="text-[5vh] font-black text-indigo-600 mb-2">{item.term}</p>
        <p className="text-[2.5vh] text-slate-500 font-bold">{item.definition}</p>
      </div>
    ))}
  </div>
);

const DiscussionBlock = ({ block }: { block: any }) => (
  <div className="w-full max-w-5xl mx-auto bg-indigo-50 rounded-[4rem] p-16 border-8 border-indigo-100 shadow-2xl">
    <div className="flex items-center gap-6 mb-12 justify-center">
      <div className="p-6 bg-indigo-600 text-white rounded-3xl shadow-xl" aria-hidden="true"><MessageCircle size={48} /></div>
      <h3 className="text-[5vh] font-black text-indigo-900">{block.title || "Let's Discuss"}</h3>
    </div>
    <div className="space-y-8">
      {(block.questions || []).map((q: string, j: number) => (
        <div key={j} className="bg-white p-8 rounded-[2rem] shadow-md border-4 border-indigo-50 flex gap-6 items-start">
          <span className="text-[4vh] font-black text-indigo-300">{j + 1}</span>
          <p className="text-[4vh] font-bold text-slate-800 leading-tight">{q}</p>
        </div>
      ))}
    </div>
  </div>
);

const GameBlock = ({ block, lessonVocab }: { block: any, lessonVocab: any }) => (
  <div className="w-full max-w-6xl mx-auto flex flex-col items-center">
    <div className="text-center mb-12">
      <div className="inline-flex items-center justify-center p-6 bg-indigo-50 text-indigo-600 rounded-3xl mb-8 shadow-inner" aria-hidden="true">
        <Gamepad2 size={64} />
      </div>
      <h3 className="text-[6vh] font-black text-slate-800 leading-none">{block.title || "Vocabulary Battle"}</h3>
      <p className="text-[3vh] font-bold text-slate-400 uppercase tracking-[0.4em] mt-4">Local Multiplayer Mode</p>
    </div>
    <div className="scale-[1.2] origin-top mt-8 w-full flex justify-center pointer-events-auto">
      <ConnectThreeVocab vocabList={lessonVocab} />
    </div>
  </div>
);

const ScenarioBlock = ({ block, liveState }: { block: any, liveState: any }) => {
  const activeNodeId = liveState?.currentNodeId || block.nodes?.[0]?.id;
  const currentNode = block.nodes?.find((n:any) => n.id === activeNodeId) || block.nodes?.[0];
  const bgColors: any = { neutral: 'bg-emerald-900 border-emerald-500', success: 'bg-indigo-900 border-indigo-500', failure: 'bg-rose-900 border-rose-500' };
  const style = bgColors[currentNode?.color || 'neutral'];

  return (
    <div className={`w-full max-w-5xl mx-auto rounded-[4rem] p-16 text-white shadow-2xl border-8 text-center transition-colors duration-500 ${style}`}>
      <span className="text-[2vh] font-black uppercase tracking-widest block mb-8 opacity-70">Interactive Scenario • {currentNode?.speaker || 'Character'}</span>
      <h3 className="text-[5vh] font-serif italic mb-12 leading-tight">"{currentNode?.text}"</h3>
      <div className="inline-block px-8 py-4 bg-black/20 rounded-full border-2 border-white/20 backdrop-blur-md">
        <p className="text-[3vh] font-bold text-white">Look at your device to make a choice!</p>
      </div>
    </div>
  );
};

const FillBlankBlock = ({ block, liveState }: { block: any, liveState: any }) => {
  const shuffledWords = useMemo(() => {
    const extractedWords = block.text?.match(/\[(.*?)\]/g)?.map((s:string) => s.replace(/\[|\]/g, '')) || [];
    const allWords = block.distractors ? [...block.distractors, ...extractedWords] : extractedWords;
    return allWords.sort(() => 0.5 - Math.random());
  }, [block]);

  return (
    <div className="w-full max-w-6xl mx-auto bg-white p-16 rounded-[4rem] border-4 border-slate-100 shadow-2xl">
      <h3 className="text-[4vh] font-bold text-slate-800 mb-12 flex items-center gap-4">
        <span className="bg-indigo-100 text-indigo-600 p-4 rounded-2xl" aria-hidden="true"><Puzzle size={40}/></span>
        {block.question}
      </h3>
      <div className="text-[6vh] font-medium leading-loose text-slate-700 flex flex-wrap items-center gap-y-6 justify-center text-center">
        {block.text?.split(/\[(.*?)\]/g).map((part: string, idx: number) => {
          if (idx % 2 === 0) return <span key={idx} className="mx-2">{part}</span>;
          
          const blankIdx = Math.floor(idx / 2);
          const filledWord = liveState?.answers?.[blankIdx];
          const isChecking = liveState?.submitted;
          const isRight = filledWord === part;

          let style = "border-dashed border-slate-300 bg-slate-50 text-slate-400";
          if (filledWord && !isChecking) style = "border-solid border-indigo-400 bg-indigo-100 text-indigo-700 shadow-lg scale-110 -translate-y-2";
          if (isChecking && isRight) style = "border-solid border-emerald-500 bg-emerald-100 text-emerald-700 shadow-lg";
          if (isChecking && !isRight) style = "border-solid border-rose-500 bg-rose-100 text-rose-700 shadow-lg";

          return (
            <span key={idx} className={`min-w-[150px] h-20 px-8 mx-3 rounded-2xl border-4 flex items-center justify-center text-[4vh] font-bold transition-all duration-300 ${style}`}>
              {filledWord || "?"}
            </span>
          );
        })}
      </div>
      
      {!liveState?.submitted && (
        <div className="mt-16 flex flex-wrap gap-4 justify-center">
          {shuffledWords.map((word: string, i: number) => {
            const isUsed = liveState?.answers?.includes(word);
            return (
              <span key={i} className={`px-6 py-3 rounded-xl border-2 text-[3vh] font-bold transition-all duration-300 ${isUsed ? 'bg-slate-50 border-slate-100 text-slate-300 scale-95' : 'bg-slate-100 border-slate-200 text-slate-500 shadow-sm'}`}>
                {word}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};
