// src/components/ClassView.tsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { doc, setDoc } from 'firebase/firestore'; 
import { db } from '../config/firebase';
import { useLiveClass } from '../hooks/useLiveClass';
import { 
    MessageSquare, MessageCircle, Gamepad2, CheckCircle2, X, Puzzle, 
    ChevronLeft, ChevronRight, Zap, Users, Clock, EyeOff, HelpCircle, 
    Layers, MousePointerClick, QrCode, Hourglass, Play, Pause, RotateCcw, 
    Plus, Minus, PenTool, Crosshair, Eraser, Wrench, Highlighter, Type, Presentation
} from 'lucide-react';
import ConnectThreeVocab from './ConnectThreeVocab';

// ============================================================================
//  CLASS VIEW (The Projector / Big Screen Mode with Keyboard Nav)
// ============================================================================
export default function ClassView({ lesson, classId, userData, activeOrg, onExit }: any) {
  const [activePageIdx, setActivePageIdx] = useState(0);
  const [showForum, setShowForum] = useState(false);
  
  // 🔥 OS FEATURE: Presentation Telemetry & Overlays
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isBlanked, setIsBlanked] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  
  // 🔥 OS FEATURE: Moveable Draggable Timer
  const [showTimer, setShowTimer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerPos, setTimerPos] = useState({ x: 50, y: 50 });
  const isDraggingTimer = useRef(false);
  const timerDragOffset = useRef({ x: 0, y: 0 });

  // 🔥 OS FEATURE: Spotlight
  const [isSpotlight, setIsSpotlight] = useState(false);
  const [mousePos, setMousePos] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  
  // 🎨 NEW: Moveable, Resizable, Dual-Layer Annotation Engine
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [markerColor, setMarkerColor] = useState('#ef4444');
  const [markerSize, setMarkerSize] = useState(6);
  const [markerStyle, setMarkerStyle] = useState<'pen' | 'highlighter' | 'text'>('pen');
  
  const [toolbarPos, setToolbarPos] = useState({ x: window.innerWidth - 120, y: 80 });
  const [toolbarScale, setToolbarScale] = useState(1);
  const isDraggingToolbar = useRef(false);
  const isResizingToolbar = useRef(false);
  const toolbarDragOffset = useRef({ x: 0, y: 0 });
  const toolbarStartData = useRef({ y: 0, scale: 1 });

  const [slideTexts, setSlideTexts] = useState<{id: number, x: number, y: number, text: string, color: string, size: number}[]>([]);
  const [boardTexts, setBoardTexts] = useState<{id: number, x: number, y: number, text: string, color: string, size: number}[]>([]);
  const [activeText, setActiveText] = useState<{x: number, y: number, text: string} | null>(null);

  // Refs for State-Safe Routing (Prevents Race Conditions)
  const activeTextRef = useRef(activeText);
  const markerColorRef = useRef(markerColor);
  const markerSizeRef = useRef(markerSize);
  const showWhiteboardRef = useRef(showWhiteboard);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => { activeTextRef.current = activeText; }, [activeText]);
  useEffect(() => { markerColorRef.current = markerColor; }, [markerColor]);
  useEffect(() => { markerSizeRef.current = markerSize; }, [markerSize]);
  useEffect(() => { showWhiteboardRef.current = showWhiteboard; }, [showWhiteboard]);

  const classViewRef = useRef<HTMLDivElement>(null);
  const slideCanvasRef = useRef<HTMLCanvasElement>(null);
  const boardCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingAnnotation = useRef(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const { liveState, startLiveClass, endLiveClass, changeSlide, triggerQuiz } = useLiveClass(classId, true);

  const lessonVocab = useMemo(() => {
    if (!lesson?.blocks) return [];
    return lesson.blocks
      .filter((b: any) => String(b.type) === 'vocab-list')
      .flatMap((b: any) => b.items || []);
  }, [lesson]);

  // Main Classroom Clock
  useEffect(() => {
      if (!lesson?.id) return;
      startLiveClass(lesson.id);
      const timer = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
      setTimerPos({ x: window.innerWidth - 350, y: 50 }); 
      setToolbarPos({ x: window.innerWidth - 120, y: 80 });
      return () => { clearInterval(timer); endLiveClass(); };
  }, [lesson?.id]);

  useEffect(() => {
      let interval: NodeJS.Timeout;
      if (timerRunning && timeLeft > 0) {
          interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      } else if (timeLeft === 0 && timerRunning) {
          setTimerRunning(false);
      }
      return () => clearInterval(interval);
  }, [timerRunning, timeLeft]);

  // 🔥 DRAGGING ENGINE (Timer, Toolbar, Spotlight)
  const startTimerDrag = (e: React.MouseEvent) => {
      isDraggingTimer.current = true;
      timerDragOffset.current = { x: e.clientX - timerPos.x, y: e.clientY - timerPos.y };
  };

  const startToolbarDrag = (e: React.MouseEvent) => {
      isDraggingToolbar.current = true;
      toolbarDragOffset.current = { x: e.clientX - toolbarPos.x, y: e.clientY - toolbarPos.y };
  };

  const startToolbarResize = (e: React.MouseEvent) => {
      e.stopPropagation(); 
      isResizingToolbar.current = true;
      toolbarStartData.current = { y: e.clientY, scale: toolbarScale };
  };

  useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
          if (isDraggingTimer.current) {
              setTimerPos({ x: e.clientX - timerDragOffset.current.x, y: e.clientY - timerDragOffset.current.y });
          }
          if (isDraggingToolbar.current) {
              setToolbarPos({ x: e.clientX - toolbarDragOffset.current.x, y: e.clientY - toolbarDragOffset.current.y });
          }
          if (isResizingToolbar.current) {
              const dy = e.clientY - toolbarStartData.current.y;
              const newScale = Math.max(0.6, Math.min(2.2, toolbarStartData.current.scale + (dy * 0.005)));
              setToolbarScale(newScale);
          }
          if (isSpotlight) {
              if (classViewRef.current) {
                  const rect = classViewRef.current.getBoundingClientRect();
                  setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
              } else {
                  setMousePos({ x: e.clientX, y: e.clientY });
              }
          }
      };
      const handleMouseUp = () => { 
          isDraggingTimer.current = false; 
          isDraggingToolbar.current = false;
          isResizingToolbar.current = false;
      };
      
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      
      return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
      };
  }, [isSpotlight]);

  const getRelativeCoords = (clientX: number, clientY: number) => {
      if (!classViewRef.current) return { x: clientX, y: clientY };
      const rect = classViewRef.current.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
  };

  // Dual-Layer Canvas Initialization
  useEffect(() => {
      const resizeCanvas = () => {
          if (classViewRef.current) {
              const rect = classViewRef.current.getBoundingClientRect();
              if (slideCanvasRef.current) {
                  slideCanvasRef.current.width = rect.width;
                  slideCanvasRef.current.height = rect.height;
              }
              if (boardCanvasRef.current) {
                  boardCanvasRef.current.width = rect.width;
                  boardCanvasRef.current.height = rect.height;
              }
          }
      };
      window.addEventListener('resize', resizeCanvas);
      setTimeout(resizeCanvas, 50); 
      return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const applyBrushSettings = (ctx: CanvasRenderingContext2D) => {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = markerColor;
      if (markerStyle === 'highlighter') {
          ctx.lineWidth = markerSize * 4; 
          ctx.globalAlpha = 0.3;          
      } else {
          ctx.lineWidth = markerSize;     
          ctx.globalAlpha = 1.0;          
      }
  };

  const forceSaveText = useCallback(() => {
      const curr = activeTextRef.current;
      if (curr && curr.text.trim().length > 0) {
          const newText = { id: Date.now(), x: curr.x, y: curr.y, text: curr.text, color: markerColorRef.current, size: markerSizeRef.current };
          if (showWhiteboardRef.current) {
              setBoardTexts(prev => [...prev, newText]);
          } else {
              setSlideTexts(prev => [...prev, newText]);
          }
      }
      setActiveText(null);
  }, []);

  const startAnnotation = (e: React.MouseEvent) => {
      const coords = getRelativeCoords(e.clientX, e.clientY);
      
      if (markerStyle === 'text') {
          forceSaveText(); 
          setActiveText({ x: coords.x, y: coords.y, text: '' });
          setTimeout(() => inputRef.current?.focus(), 50);
          return;
      }

      forceSaveText(); 
      isDrawingAnnotation.current = true;
      const targetCanvas = showWhiteboardRef.current ? boardCanvasRef.current : slideCanvasRef.current;
      const ctx = targetCanvas?.getContext('2d');
      if (ctx) {
          applyBrushSettings(ctx);
          ctx.beginPath();
          ctx.moveTo(coords.x, coords.y);
          ctx.lineTo(coords.x, coords.y);
          ctx.stroke();
      }
  };

  const drawAnnotation = (e: React.MouseEvent) => {
      if (!isDrawingAnnotation.current || markerStyle === 'text') return;
      const targetCanvas = showWhiteboardRef.current ? boardCanvasRef.current : slideCanvasRef.current;
      const ctx = targetCanvas?.getContext('2d');
      if (!ctx) return;
      const coords = getRelativeCoords(e.clientX, e.clientY);
      applyBrushSettings(ctx);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
  };

  const stopAnnotation = () => {
      isDrawingAnnotation.current = false;
      const targetCanvas = showWhiteboardRef.current ? boardCanvasRef.current : slideCanvasRef.current;
      targetCanvas?.getContext('2d')?.beginPath();
  };

  const clearAnnotations = () => {
      const canvas = showWhiteboard ? boardCanvasRef.current : slideCanvasRef.current;
      if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      if (showWhiteboard) {
          setBoardTexts([]);
      } else {
          setSlideTexts([]);
      }
      setActiveText(null);
  };

  const handleRightClick = (e: React.MouseEvent) => {
      if (isAnnotating || isSpotlight) {
          e.preventDefault(); 
          setIsAnnotating(false);
          setIsSpotlight(false);
          forceSaveText();
      }
  };

  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const pages = useMemo(() => {
    if (!lesson?.blocks || !Array.isArray(lesson.blocks)) return [];
    const grouped: any[] = [];
    let buffer: any[] = [];
    const interactables = ['quiz', 'flashcard', 'scenario', 'fill-blank', 'discussion', 'game', 'drag-drop'];
    
    lesson.blocks.forEach((b: any) => {
      const type = String(b?.type || '');
      if (interactables.indexOf(type) !== -1) {
        if (buffer.length > 0) grouped.push({ type: 'read', blocks: [...buffer] });
        grouped.push({ type: 'interact', blocks: [b] });
        buffer = [];
      } else { buffer.push(b); }
    });
    if (buffer.length > 0) grouped.push({ type: 'read', blocks: [...buffer] });
    return grouped;
  }, [lesson]);

  const jumpToSlide = useCallback((index: number) => {
      if (index >= 0 && index < pages.length) {
          setActivePageIdx(index);
          changeSlide(index);
          if (stageRef.current) stageRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
  }, [pages.length, changeSlide]);

  const handleNext = useCallback(() => jumpToSlide(activePageIdx + 1), [activePageIdx, jumpToSlide]);
  const handlePrev = useCallback(() => jumpToSlide(activePageIdx - 1), [activePageIdx, jumpToSlide]);

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressBarRef.current) return;
      const rect = progressBarRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const targetSlide = Math.floor(percentage * pages.length);
      jumpToSlide(targetSlide);
  };

  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          const tag = (e.target as HTMLElement).tagName;
          if (['INPUT', 'TEXTAREA'].indexOf(tag) !== -1 && e.key !== 'Escape') return; // Safe Typing
          
          if (e.key === 'ArrowRight' || e.key === ' ') { 
              e.preventDefault(); handleNext();
          } else if (e.key === 'ArrowLeft') {
              e.preventDefault(); handlePrev();
          } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              if (stageRef.current) stageRef.current.scrollBy({ top: window.innerHeight * 0.4, behavior: 'smooth' });
          } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              if (stageRef.current) stageRef.current.scrollBy({ top: -(window.innerHeight * 0.4), behavior: 'smooth' });
          } else if (e.key.toLowerCase() === 'b') {
              e.preventDefault(); setIsBlanked(prev => !prev);
          } else if (e.key.toLowerCase() === 'q') {
              e.preventDefault(); setShowQR(prev => !prev); setShowTools(false);
          } else if (e.key.toLowerCase() === 't') {
              e.preventDefault(); setShowTimer(prev => !prev); setShowTools(false);
          } else if (e.key.toLowerCase() === 'a') {
              e.preventDefault(); 
              setIsAnnotating(prev => { if (!prev) setIsSpotlight(false); return !prev; });
              setShowTools(false);
          } else if (e.key.toLowerCase() === 's') {
              e.preventDefault(); 
              setIsSpotlight(prev => { if (!prev) setIsAnnotating(false); return !prev; });
              setShowTools(false);
          } else if (e.key.toLowerCase() === 'c') {
              e.preventDefault(); 
              setShowWhiteboard(prev => {
                  if (!prev) setIsAnnotating(true); 
                  return !prev;
              });
              setShowTools(false);
          } else if (e.key.toLowerCase() === 'w') {
              e.preventDefault(); setShowTools(prev => !prev);
          } else if (e.key === 'Escape') {
              setShowQR(false); setShowTimer(false); setIsSpotlight(false); setIsAnnotating(false); setShowTools(false); setShowWhiteboard(false);
              forceSaveText();
          }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, forceSaveText]);

  const activePage = pages[activePageIdx];
  if (!lesson || !activePage) return null;

  const joinUrl = `${window.location.origin}/join/${classId}`;

  return (
    <div 
        ref={classViewRef}
        className="w-full flex flex-col bg-slate-900 text-white overflow-hidden font-sans selection:bg-indigo-500 relative"
        style={{ height: 'calc(100dvh - 4rem)' }}
        onContextMenu={handleRightClick} 
    >
      {/* 🔥 OS OVERLAYS & TOOLS */}
      <div className={`absolute inset-0 bg-black z-[9000] flex items-center justify-center transition-opacity duration-700 pointer-events-none ${isBlanked ? 'opacity-100' : 'opacity-0'}`}>
          <EyeOff size={64} className="text-white/10" />
      </div>

      {isSpotlight && (
          <div 
              className="absolute inset-0 z-[8500] pointer-events-none transition-opacity duration-150"
              style={{ background: `radial-gradient(circle 150px at ${mousePos.x}px ${mousePos.y}px, transparent 0%, rgba(0,0,0,0.85) 100%)` }}
          />
      )}

      {/* 1. SLIDE ANNOTATION LAYER (Static over slides) */}
      <div className="absolute inset-0 z-[8400] pointer-events-none overflow-hidden">
          <canvas ref={slideCanvasRef} className="absolute inset-0 w-full h-full" />
          {slideTexts.map(t => (
              <div key={t.id} style={{ position: 'absolute', left: t.x, top: t.y, color: t.color, fontSize: `${t.size * 6}px`, fontWeight: 'bold', transform: 'translateY(-50%)', whiteSpace: 'nowrap' }}>{t.text}</div>
          ))}
      </div>

      {/* 2. WHITEBOARD SCRATCHPAD LAYER (Rolls up and down) */}
      <div 
          className={`absolute inset-0 z-[8550] transition-transform duration-500 ease-in-out pointer-events-none overflow-hidden ${showWhiteboard ? 'translate-y-0' : '-translate-y-full'}`}
          style={{ backgroundColor: '#f8fafc', backgroundImage: 'radial-gradient(#cbd5e1 2px, transparent 2px)', backgroundSize: '40px 40px' }}
      >
          <canvas ref={boardCanvasRef} className="absolute inset-0 w-full h-full" />
          {boardTexts.map(t => (
              <div key={t.id} style={{ position: 'absolute', left: t.x, top: t.y, color: t.color, fontSize: `${t.size * 6}px`, fontWeight: 'bold', transform: 'translateY(-50%)', whiteSpace: 'nowrap' }}>{t.text}</div>
          ))}
      </div>

      {/* 3. INVISIBLE GLASS ROUTER PANE (Catches clicks, draws ink) */}
      <div
          onMouseDown={startAnnotation}
          onMouseMove={drawAnnotation}
          onMouseUp={stopAnnotation}
          onMouseLeave={stopAnnotation}
          className={`absolute inset-0 z-[8600] ${isAnnotating ? (markerStyle === 'text' ? 'pointer-events-auto cursor-text' : 'pointer-events-auto cursor-crosshair') : 'pointer-events-none'}`}
      >
          {activeText && (
              <input 
                  ref={inputRef}
                  value={activeText.text}
                  onChange={e => setActiveText({...activeText, text: e.target.value})}
                  onKeyDown={e => { if (e.key === 'Enter') forceSaveText(); }}
                  onMouseDown={e => e.stopPropagation()} 
                  className="pointer-events-auto shadow-2xl" 
                  style={{ 
                      position: 'absolute', left: activeText.x, top: activeText.y, color: markerColor, 
                      fontSize: `${markerSize * 6}px`, fontWeight: 'bold', background: 'transparent', 
                      outline: 'none', border: 'none', borderBottom: `3px dashed ${markerColor}50`, 
                      transform: 'translateY(-50%)', minWidth: '400px'
                  }}
              />
          )}
      </div>

      {/* 🎨 ADVANCED FLOATING PALETTE */}
      {isAnnotating && (
          <div 
              className="absolute z-[8700] flex flex-col items-center pointer-events-auto animate-in fade-in zoom-in-95 duration-200"
              style={{ left: toolbarPos.x, top: toolbarPos.y, transform: `scale(${toolbarScale})`, transformOrigin: 'top left' }}
              onMouseDown={(e) => e.stopPropagation()}
          >
              <div className="bg-slate-900/95 backdrop-blur-2xl p-4 pt-1 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 border-slate-700 flex flex-col gap-5 w-20 items-center relative overflow-hidden">
                  
                  {/* The Move Drag Handle */}
                  <div 
                      className="w-full h-8 cursor-grab active:cursor-grabbing flex justify-center items-center opacity-50 hover:opacity-100 transition-opacity bg-slate-800/50 rounded-t-[2rem] -mt-1 mb-1"
                      onMouseDown={startToolbarDrag}
                      title="Drag to move"
                  >
                      <div className="w-8 h-1.5 bg-slate-400 rounded-full" />
                  </div>

                  {/* Tool Toggle */}
                  <div className="flex flex-col gap-2 bg-slate-800/80 p-2 rounded-3xl w-full items-center border border-slate-700">
                      <button onClick={() => { setMarkerStyle('pen'); forceSaveText(); }} className={`p-3 rounded-2xl transition-all ${markerStyle === 'pen' ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.6)]' : 'text-slate-400 hover:text-white'}`}>
                          <PenTool size={24} />
                      </button>
                      <button onClick={() => { setMarkerStyle('highlighter'); forceSaveText(); }} className={`p-3 rounded-2xl transition-all ${markerStyle === 'highlighter' ? 'bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.6)]' : 'text-slate-400 hover:text-white'}`}>
                          <Highlighter size={24} />
                      </button>
                      <button onClick={() => { setMarkerStyle('text'); forceSaveText(); }} className={`p-3 rounded-2xl transition-all ${markerStyle === 'text' ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.6)]' : 'text-slate-400 hover:text-white'}`}>
                          <Type size={24} />
                      </button>
                  </div>

                  {/* Colors */}
                  <div className="flex flex-col gap-3">
                      {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#ffffff', '#0f172a'].map(c => (
                          <button 
                              key={c} 
                              onClick={() => { setMarkerColor(c); if(activeText) setActiveText({...activeText}); }} 
                              className={`w-10 h-10 rounded-full border-4 transition-transform ${markerColor === c ? 'scale-125 border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]' : 'border-slate-800 hover:scale-110 shadow-sm'}`} 
                              style={{ backgroundColor: c }} 
                          />
                      ))}
                  </div>

                  {/* Sizes */}
                  <div className="flex flex-col items-center gap-3 bg-slate-800/80 p-2 rounded-3xl w-full border border-slate-700">
                      {[4, 8, 14].map(s => (
                          <button key={s} onClick={() => { setMarkerSize(s); if(activeText) setActiveText({...activeText}); }} className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-colors ${markerSize === s ? 'bg-slate-700' : 'hover:bg-slate-700/50'}`}>
                              <div className={`rounded-full transition-all ${markerStyle === 'text' ? 'bg-emerald-500' : 'bg-slate-300'}`} style={{ width: s, height: s }} />
                          </button>
                      ))}
                  </div>
                  
                  {/* Clear button */}
                  <button onClick={clearAnnotations} title="Clear Ink & Text" className="bg-slate-800 hover:bg-rose-500 text-slate-400 hover:text-white p-4 rounded-2xl transition-all w-full flex items-center justify-center mb-4">
                      <Eraser size={24} />
                  </button>

                  {/* The Scale Resize Handle */}
                  <div 
                      className="absolute bottom-0 right-0 w-10 h-10 cursor-nwse-resize flex items-end justify-end p-2 opacity-50 hover:opacity-100 bg-slate-800/30 rounded-tl-full"
                      onMouseDown={startToolbarResize}
                      title="Drag to resize"
                  >
                      <div className="w-3 h-3 border-b-2 border-r-2 border-slate-400 rounded-br-[2px] mb-1 mr-1" />
                  </div>
              </div>
          </div>
      )}

      {showQR && (
          <div className="absolute inset-0 z-[9999] bg-slate-900/90 backdrop-blur-2xl flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300 pointer-events-auto">
              <button onClick={() => setShowQR(false)} className="absolute top-12 right-12 p-6 bg-white/10 hover:bg-rose-500 rounded-full text-white transition-all hover:scale-110 active:scale-95"><X size={40} strokeWidth={3} /></button>
              <h2 className="text-[6vh] font-black text-white uppercase tracking-widest mb-4">Join Live Session</h2>
              <p className="text-[3vh] text-indigo-300 font-bold tracking-widest uppercase mb-16">Scan to sync your device</p>
              <div className="p-10 bg-white rounded-[3rem] shadow-[0_0_100px_rgba(99,102,241,0.4)] animate-in slide-in-from-bottom-8">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(joinUrl)}&margin=10`} alt="Join QR" className="w-[40vh] h-[40vh] object-contain" />
              </div>
              <div className="mt-16 text-center">
                  <p className="text-[2vh] font-bold text-slate-400 uppercase tracking-[0.4em] mb-4">Or enter room code</p>
                  <div className="text-[8vh] font-black text-indigo-400 tracking-[0.2em] leading-none bg-indigo-500/10 py-6 px-12 rounded-[2rem] border-2 border-indigo-500/20">{String(classId || '').substring(0,6).toUpperCase()}</div>
              </div>
          </div>
      )}

      {showTimer && (
          <div className="absolute z-[9500] bg-slate-900/90 backdrop-blur-xl border-4 border-slate-700 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 pointer-events-auto" style={{ left: timerPos.x, top: timerPos.y, width: 320 }}>
              <div className="bg-slate-800/80 p-3 cursor-grab active:cursor-grabbing flex justify-between items-center" onMouseDown={startTimerDrag}>
                  <div className="flex items-center gap-2 text-slate-400 px-2"><Hourglass size={14} /><span className="text-[10px] font-black uppercase tracking-widest">Focus Timer</span></div>
                  <button onClick={() => setShowTimer(false)} className="text-slate-400 hover:text-rose-400 transition-colors"><X size={18} strokeWidth={3} /></button>
              </div>
              <div className="p-8 flex flex-col items-center">
                  <div className={`text-7xl font-black font-mono tracking-tighter mb-6 ${timeLeft === 0 ? 'text-rose-500 animate-pulse' : 'text-white'}`}>{formatTime(timeLeft)}</div>
                  <div className="grid grid-cols-2 gap-3 w-full mb-4">
                      <button onClick={() => setTimeLeft(t => Math.max(0, t - 60))} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 font-bold flex justify-center items-center gap-1 transition-all active:scale-95"><Minus size={16} /> 1m</button>
                      <button onClick={() => setTimeLeft(t => t + 60)} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 font-bold flex justify-center items-center gap-1 transition-all active:scale-95"><Plus size={16} /> 1m</button>
                  </div>
                  <div className="flex gap-3 w-full">
                      <button onClick={() => { setTimeLeft(300); setTimerRunning(false); }} className="p-4 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 rounded-2xl text-slate-400 font-bold flex justify-center items-center transition-all active:scale-95 w-1/3"><RotateCcw size={20} /></button>
                      <button onClick={() => setTimerRunning(!timerRunning)} className={`p-4 rounded-2xl font-black uppercase tracking-widest flex justify-center items-center gap-2 transition-all active:scale-95 w-2/3 ${timerRunning ? 'bg-amber-500 text-slate-900 hover:bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]'}`}>
                          {timerRunning ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                          {timerRunning ? 'Pause' : 'Start'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* 🔥 THE TOOLS DRAWER */}
      {showTools && (
          <div className="absolute right-8 bottom-28 z-[8900] bg-slate-900/95 backdrop-blur-2xl border-4 border-slate-700 rounded-[2.5rem] p-6 shadow-2xl flex flex-col gap-3 animate-in slide-in-from-bottom-10 fade-in w-72 pointer-events-auto">
              <div className="flex items-center justify-between mb-2 px-2">
                  <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Smartboard Tools</span>
                  <button onClick={() => setShowTools(false)} className="text-slate-500 hover:text-white transition-colors"><X size={20} strokeWidth={3} /></button>
              </div>
              <button onClick={() => { setShowQR(true); setShowTools(false); }} className="flex items-center gap-4 px-6 py-4 bg-slate-800 hover:bg-indigo-600 text-white rounded-2xl transition-all font-bold shadow-sm active:scale-95 border border-slate-700 hover:border-indigo-500 text-left">
                  <QrCode size={20} /> <span className="flex-1">QR Code Menu</span> <span className="text-slate-500 text-xs font-black">Q</span>
              </button>
              <button onClick={() => { setShowTimer(p => !p); setShowTools(false); }} className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold shadow-sm active:scale-95 border text-left ${showTimer ? 'bg-amber-600 text-white border-amber-500' : 'bg-slate-800 hover:bg-amber-600 text-slate-300 hover:text-white border-slate-700 hover:border-amber-500'}`}>
                  <Hourglass size={20} /> <span className="flex-1">Focus Timer</span> <span className="text-amber-500/50 text-xs font-black">T</span>
              </button>
              <button onClick={() => { setIsAnnotating(p => !p); setIsSpotlight(false); setShowTools(false); }} className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold shadow-sm active:scale-95 border text-left ${isAnnotating ? 'bg-rose-600 text-white border-rose-500' : 'bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white border-slate-700 hover:border-rose-500'}`}>
                  <PenTool size={20} /> <span className="flex-1">Digital Marker</span> <span className="text-rose-500/50 text-xs font-black">A</span>
              </button>
              
              <button onClick={() => { setShowWhiteboard(p => !p); setIsAnnotating(true); setShowTools(false); }} className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold shadow-sm active:scale-95 border text-left ${showWhiteboard ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white border-slate-700 hover:border-blue-500'}`}>
                  <Presentation size={20} /> <span className="flex-1">Whiteboard</span> <span className="text-blue-500/50 text-xs font-black">C</span>
              </button>

              <button onClick={() => { setIsSpotlight(p => !p); setIsAnnotating(false); setShowTools(false); }} className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold shadow-sm active:scale-95 border text-left ${isSpotlight ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white border-slate-700 hover:border-emerald-500'}`}>
                  <Crosshair size={20} /> <span className="flex-1">Spotlight</span> <span className="text-emerald-500/50 text-xs font-black">S</span>
              </button>
              <div className="h-px w-full bg-slate-700 my-1" />
              <button onClick={() => setIsBlanked(p => !p)} className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold shadow-sm active:scale-95 border text-left ${isBlanked ? 'bg-white text-black border-slate-200' : 'bg-slate-950 text-slate-400 hover:bg-black hover:text-white border-slate-800'}`}>
                  <EyeOff size={20} /> <span className="flex-1">{isBlanked ? 'Restore Screen' : 'Blackout Screen'}</span> <span className="text-slate-600 text-xs font-black">B</span>
              </button>
          </div>
      )}

      {/* CORE PRESENTATION LAYER */}
      <main className="flex-1 flex overflow-hidden relative group/canvas bg-slate-50 text-slate-900 z-0">
        
        {activePageIdx > 0 && (
            <button onClick={handlePrev} className="absolute left-8 top-1/2 -translate-y-1/2 z-50 p-6 bg-slate-900/5 hover:bg-slate-900 text-slate-800 hover:text-white rounded-full backdrop-blur-md opacity-0 group-hover/canvas:opacity-100 transition-all duration-300 hover:scale-110 shadow-lg"><ChevronLeft size={48} /></button>
        )}
        {activePageIdx < pages.length - 1 && (
            <button onClick={handleNext} className="absolute right-8 top-1/2 -translate-y-1/2 z-50 p-6 bg-slate-900/5 hover:bg-slate-900 text-slate-800 hover:text-white rounded-full backdrop-blur-md opacity-0 group-hover/canvas:opacity-100 transition-all duration-300 hover:scale-110 shadow-lg"><ChevronRight size={48} /></button>
        )}

        <div ref={stageRef} className={`flex-1 overflow-y-auto w-full relative transition-all duration-500 ${showForum ? 'mr-[450px]' : ''} scroll-smooth`}>
          <div className="flex flex-col min-h-full w-full items-center px-16 py-12 lg:px-32">
            <div className="w-full max-w-7xl space-y-24 my-auto">
              {activePage.blocks.map((block: any, i: number) => {
                if (!block) return null;
                const blockType = String(block.type || '');
                const isQuiz = blockType === 'quiz';
                const answerCount = Object.keys(liveState?.answers || {}).length;

                return (
                  <div key={i} className="animate-in fade-in zoom-in-95 duration-700 w-full">
                    {isQuiz ? (
                      <div className="bg-slate-900 text-white border-4 border-slate-800 rounded-[4rem] p-16 shadow-2xl text-center animate-in slide-in-from-bottom-12 duration-500 mx-auto max-w-5xl my-12 relative overflow-hidden">
                          <div className="absolute top-0 right-0 -mr-16 -mt-16 text-slate-800 opacity-50 rotate-12"><HelpCircle size={250} /></div>
                          <div className="relative z-10">
                              <span className="text-[2vh] font-black text-indigo-400 uppercase tracking-widest block mb-6">Class Question</span>
                              <h2 className="text-[5vh] md:text-[6vh] font-black mb-12 leading-tight">{String(block.content?.question || block.question || '')}</h2>
                              
                              {liveState?.quizState === 'waiting' && (
                                  <button onClick={() => triggerQuiz('active')} className="bg-rose-500 hover:bg-rose-600 text-white px-12 py-6 rounded-full font-black text-[3vh] uppercase tracking-widest shadow-[0_0_40px_rgba(244,63,94,0.5)] transition-transform active:scale-95 flex items-center gap-4 mx-auto"><Zap size={40} fill="currentColor" /> Launch Trivia Protocol</button>
                              )}

                              {liveState?.quizState === 'active' && (
                                  <div className="space-y-12 animate-in fade-in duration-500">
                                      <div className="flex flex-col items-center justify-center gap-4 text-[6vh] font-black text-indigo-400">
                                          <div className="flex items-center gap-6 bg-slate-800 px-10 py-6 rounded-[2rem] shadow-inner border border-slate-700">
                                              <Users size={64} className="animate-pulse" /> <span>{answerCount} Students Locked In</span>
                                          </div>
                                      </div>
                                      <button onClick={() => triggerQuiz('revealed')} className="bg-indigo-600 hover:bg-indigo-500 text-white px-12 py-6 rounded-full font-black text-[3vh] uppercase tracking-widest transition-transform active:scale-95 shadow-xl mx-auto">Reveal Correct Answer</button>
                                  </div>
                              )}

                              {liveState?.quizState === 'revealed' && (
                                  <div className="animate-in zoom-in duration-500 flex flex-col items-center">
                                      <div className="inline-flex items-center gap-4 bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/50 px-10 py-5 rounded-[2rem] text-[4vh] font-black mb-12 shadow-[0_0_30px_rgba(16,185,129,0.2)]"><CheckCircle2 size={48} /> Correct Answer Displayed!</div>
                                      <div className="bg-emerald-500 text-white p-8 rounded-[2rem] shadow-xl text-[4vh] font-bold border-4 border-emerald-400 min-w-[50%]">{String(block.content?.options?.find((o:any) => String(o.id) === String(block.content?.correctId))?.text || "Answer Revealed on Devices")}</div>
                                  </div>
                              )}
                          </div>
                      </div>
                    ) : (
                      <>
                          {blockType === 'text' && <TextBlock block={block} />}
                          {blockType === 'essay' && <EssayBlock block={block} />}
                          {blockType === 'image' && <ImageBlock block={block} />}
                          {blockType === 'dialogue' && <DialogueBlock block={block} />}
                          {blockType === 'vocab-list' && <VocabListBlock block={block} />}
                          {blockType === 'discussion' && <DiscussionBlock block={block} />}
                          {blockType === 'game' && block.gameType === 'connect-three' && <GameBlock block={block} lessonVocab={lessonVocab} />}
                          {blockType === 'scenario' && <ScenarioBlock block={block} liveState={liveState} />}
                          {blockType === 'fill-blank' && <FillBlankBlock block={block} liveState={liveState} />}
                          {blockType === 'drag-drop' && <TapSortBlock block={block} liveState={liveState} />}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {showForum && (
          <aside className="absolute right-0 top-0 bottom-0 w-[450px] bg-slate-50 border-l border-slate-200 p-8 z-10 animate-in slide-in-from-right shadow-2xl">
             <h3 className="text-2xl font-black mb-6 flex items-center gap-2"><MessageSquare className="text-indigo-600" aria-hidden="true"/> FORUM</h3>
             {classId ? <p className="text-slate-400">Forum Component Here</p> : <p className="text-slate-400">Class chat unavailable.</p>}
          </aside>
        )}
      </main>

      <footer className="h-20 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-12 shrink-0 relative z-[8800]">
          <div className="flex items-center gap-8">
              <h2 className="text-xl font-black text-slate-400 uppercase tracking-widest">{String(lesson?.title || '')}</h2>
              <div className="h-6 w-px bg-slate-800" />
              <span className="flex items-center gap-2 font-mono text-lg font-bold text-slate-500"><Clock size={18} /> {formatTime(elapsedTime)}</span>
              
              <div className="h-6 w-px bg-slate-800 mx-2" />
              
              {/* 🔥 NEW OS FEATURE: Consolidated Tools Drawer Toggle */}
              <button 
                  onClick={() => setShowTools(prev => !prev)} 
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all text-sm font-black uppercase tracking-widest shadow-sm active:scale-95 border ${showTools || isAnnotating || isSpotlight || showTimer || isBlanked || showWhiteboard ? 'bg-indigo-600 text-white border-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.5)]' : 'bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white border-slate-700 hover:border-indigo-500'}`}
              >
                  <Wrench size={18} /> Tools (W)
              </button>
          </div>
          
          <div className="flex items-center gap-6">
              <div ref={progressBarRef} onClick={handleProgressBarClick} className="w-64 h-3 bg-slate-800 rounded-full overflow-hidden cursor-pointer group relative">
                  <div className="absolute inset-0 bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="h-full bg-indigo-500 transition-all duration-300 relative z-10" style={{ width: `${((activePageIdx + 1) / pages.length) * 100}%` }} />
              </div>
              <span className="font-black text-slate-400 tracking-widest uppercase w-32 text-right">Slide {activePageIdx + 1} of {pages.length}</span>
          </div>
      </footer>
    </div>
  );
}

// ============================================================================
//  INTERNAL BLOCK RENDERERS
// ============================================================================

const TextBlock = ({ block }: { block: any }) => (
  <div className="text-center py-12 max-w-6xl mx-auto">
    {block.title && <h3 className="text-[3vh] font-black text-indigo-500 uppercase tracking-widest mb-8">{String(block.title)}</h3>}
    <p className="text-[6vh] font-black text-slate-800 leading-[1.1] tracking-tight">{String(block.content || '')}</p>
  </div>
);

const EssayBlock = ({ block }: { block: any }) => (
  <div className="w-full max-w-7xl mx-auto py-12">
    <h1 className="text-[8vh] font-black text-slate-900 leading-none mb-16 text-center">{String(block.title || '')}</h1>
    <div className="columns-1 xl:columns-2 gap-20 space-y-[4vh]">
        {String(block.content || '').split('\n\n').map((para: string, pIdx: number) => (
          <p key={pIdx} className="text-[3.5vh] leading-[1.7] text-slate-700 font-serif text-justify first-letter:text-[7vh] first-letter:font-black first-letter:text-indigo-600 first-letter:float-left first-letter:mr-3 break-inside-avoid">{para.trim()}</p>
        ))}
    </div>
  </div>
);

const ImageBlock = ({ block }: { block: any }) => (
  <figure className="w-full flex flex-col items-center py-12">
    <div className="relative group overflow-hidden rounded-[3rem] shadow-2xl border-8 border-slate-50">
        <img src={String(block.url || '')} alt="presentation slide" className="max-h-[65vh] object-cover animate-in zoom-in-105 duration-[20s]" />
    </div>
    {block.caption && <figcaption className="text-[3vh] text-slate-500 font-bold mt-8 text-center max-w-4xl">{String(block.caption)}</figcaption>}
  </figure>
);

const DialogueBlock = ({ block }: { block: any }) => (
  <div className="w-full max-w-5xl mx-auto space-y-12 py-12">
    {(Array.isArray(block.lines) ? block.lines : []).map((line: any, j: number) => {
      const sideRight = String(line.side) === 'right';
      const speakerInitial = typeof line.speaker === 'string' && line.speaker.trim().length > 0 ? line.speaker.trim()[0].toUpperCase() : '?';
      return (
      <div key={j} className={`flex items-end gap-6 animate-in slide-in-from-bottom-8 fade-in fill-mode-both ${sideRight ? 'flex-row-reverse' : ''}`} style={{ animationDelay: `${j * 300}ms`, animationDuration: '600ms' }}>
        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-[3vh] font-black text-white shrink-0 shadow-2xl ${sideRight ? 'bg-indigo-600' : 'bg-slate-800'}`}>{speakerInitial}</div>
        <div className={`max-w-[80%] p-10 rounded-[3rem] shadow-lg text-[4vh] font-medium leading-relaxed ${sideRight ? 'bg-indigo-500 text-white rounded-br-none' : 'bg-white border-4 border-slate-100 text-slate-800 rounded-bl-none'}`}>
          {String(line.text || '')}
          {line.translation && <p className={`text-[2.5vh] mt-6 italic opacity-80 font-bold border-t pt-4 ${sideRight ? 'border-indigo-400' : 'border-slate-200'}`}>{String(line.translation)}</p>}
        </div>
      </div>
    )})}
  </div>
);

const VocabListBlock = ({ block }: { block: any }) => (
  <div className="grid grid-cols-2 gap-10 py-12">
    {(Array.isArray(block.items) ? block.items : []).map((item: any, j: number) => (
      <div key={j} className="bg-gradient-to-br from-slate-50 to-slate-100 p-12 rounded-[3rem] border border-white shadow-xl text-left relative overflow-hidden group">
        <div className="absolute -right-12 -top-12 opacity-5 text-indigo-900 rotate-12 group-hover:scale-110 transition-transform duration-700"><Layers size={200} /></div>
        <p className="text-[5vh] font-black text-indigo-600 mb-4 relative z-10">{String(item.term || '')}</p>
        <p className="text-[3vh] text-slate-600 font-medium leading-relaxed relative z-10">{String(item.definition || '')}</p>
      </div>
    ))}
  </div>
);

const DiscussionBlock = ({ block }: { block: any }) => (
  <div className="w-full max-w-6xl mx-auto bg-indigo-50 rounded-[4rem] p-16 border-8 border-indigo-100 shadow-2xl my-12">
    <div className="flex items-center gap-6 mb-16 justify-center">
      <div className="p-6 bg-indigo-600 text-white rounded-3xl shadow-xl animate-bounce" style={{ animationDuration: '3s' }} aria-hidden="true"><MessageCircle size={48} /></div>
      <h3 className="text-[5vh] font-black text-indigo-900">{String(block.title || "Let's Discuss")}</h3>
    </div>
    <div className="space-y-8">
      {(Array.isArray(block.questions) ? block.questions : []).map((q: any, j: number) => (
        <div key={j} className="bg-white p-10 rounded-[2.5rem] shadow-md border-4 border-indigo-50 flex gap-8 items-start hover:-translate-y-2 transition-transform duration-300">
          <span className="text-[5vh] font-black text-indigo-200 leading-none">{j + 1}</span>
          <p className="text-[4vh] font-bold text-slate-800 leading-tight">{String(q || '')}</p>
        </div>
      ))}
    </div>
  </div>
);

const GameBlock = ({ block, lessonVocab }: { block: any, lessonVocab: any }) => (
  <div className="w-full max-w-6xl mx-auto flex flex-col items-center py-12">
    <div className="text-center mb-12">
      <div className="inline-flex items-center justify-center p-6 bg-indigo-50 text-indigo-600 rounded-3xl mb-8 shadow-inner" aria-hidden="true"><Gamepad2 size={64} /></div>
      <h3 className="text-[6vh] font-black text-slate-800 leading-none">{String(block.title || "Vocabulary Battle")}</h3>
      <p className="text-[3vh] font-bold text-slate-400 uppercase tracking-[0.4em] mt-4">Local Multiplayer Mode</p>
    </div>
    <div className="scale-[1.2] origin-top mt-8 w-full flex justify-center pointer-events-auto">
      <ConnectThreeVocab vocabList={lessonVocab} />
    </div>
  </div>
);

const ScenarioBlock = ({ block, liveState }: { block: any, liveState: any }) => {
  const activeNodeId = liveState?.currentNodeId || block.nodes?.[0]?.id;
  const currentNode = Array.isArray(block.nodes) ? block.nodes.find((n:any) => String(n.id) === String(activeNodeId)) || block.nodes[0] : null;
  const bgColors: any = { neutral: 'bg-emerald-900 border-emerald-500', success: 'bg-indigo-900 border-indigo-500', failure: 'bg-rose-900 border-rose-500' };
  const style = bgColors[currentNode?.color || 'neutral'];

  return (
    <div className={`w-full max-w-5xl mx-auto rounded-[4rem] p-16 text-white shadow-2xl border-8 text-center transition-colors duration-500 my-12 ${style}`}>
      <span className="text-[2vh] font-black uppercase tracking-widest block mb-8 opacity-70">Interactive Scenario • {String(currentNode?.speaker || 'Character')}</span>
      <h3 className="text-[5vh] font-serif italic mb-12 leading-tight">"{String(currentNode?.text || '')}"</h3>
      <div className="inline-block px-8 py-4 bg-black/20 rounded-full border-2 border-white/20 backdrop-blur-md animate-pulse">
        <p className="text-[3vh] font-bold text-white">Look at your device to make a choice!</p>
      </div>
    </div>
  );
};

type WordItem = { id: string; word: string };

const FillBlankBlock = ({ block, liveState }: { block: any, liveState: any }) => {
  const rawText = String(block.text || "Missing text [here].");

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

  const distractorsJson = JSON.stringify(block.distractors || []);
  const distractors = useMemo(() => {
        let rawOptions = [];
        try { rawOptions = JSON.parse(distractorsJson); } catch (e) {}
        if (!Array.isArray(rawOptions)) rawOptions = typeof rawOptions === 'string' ? [rawOptions] : [];
        return rawOptions.map((opt: any) => String(opt)).filter(Boolean);
  }, [distractorsJson]);

  const shuffledWords = useMemo(() => {
    const allWords = [...correctAnswers, ...distractors];
    return allWords.sort(() => 0.5 - Math.random());
  }, [correctAnswers, distractors]);

  const initialWordBank = useMemo(() => {
    return shuffledWords.map((w, i) => ({ id: `word_${i}_${w}`, word: w }));
  }, [shuffledWords]);

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
  const isEntirelyCorrect = isChecked && filledBlanks.every((item, i) => item?.word === correctAnswers[i]);

  return (
    <div className="w-full max-w-7xl mx-auto bg-white rounded-[4rem] border-4 border-slate-100 shadow-2xl my-12 flex flex-col relative overflow-visible pointer-events-auto">
      <div className="p-12 md:p-16 pb-8">
          <h3 className="text-[4vh] font-bold text-slate-800 flex items-center justify-center gap-4">
            <span className="bg-indigo-100 text-indigo-600 p-4 rounded-2xl" aria-hidden="true"><Puzzle size={40}/></span>
            {String(block.question || "Fill in the blanks")}
          </h3>
      </div>

      {!isChecked && (
        <div className="sticky top-4 z-50 -mx-4 px-4 mb-12">
            <div className="bg-white/95 backdrop-blur-2xl rounded-[2.5rem] p-6 border-4 border-slate-200/50 shadow-[0_10px_40px_rgba(0,0,0,0.08)] flex flex-col items-center gap-4 max-h-[25vh] transition-all duration-300">
                <span className="text-[2vh] font-black text-slate-400 uppercase tracking-widest shrink-0 text-center">Word Bank Options</span>
                <div className="flex flex-wrap gap-4 justify-center items-start overflow-y-auto custom-scrollbar w-full pb-2">
                  {wordBank.length === 0 ? (
                      <span className="text-[2.5vh] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <CheckCircle2 size={24} className="text-emerald-500" /> All placed
                      </span>
                  ) : (
                      wordBank.map((item) => (
                          <button 
                              key={item.id} onClick={() => handleBankClick(item)} disabled={isChecked}
                              className="px-6 py-3 rounded-xl border-4 text-[2.5vh] font-bold transition-all duration-300 bg-white border-slate-200 text-slate-700 shadow-sm hover:border-indigo-400 hover:text-indigo-600 hover:-translate-y-1 active:scale-95"
                          >
                              {item.word}
                          </button>
                      ))
                  )}
                </div>
            </div>
        </div>
      )}

      <div className="px-12 md:px-16 pb-16 flex-1">
          <div className="text-[4.5vh] md:text-[5vh] font-medium leading-loose text-slate-700 flex flex-wrap items-center gap-y-8 justify-center text-center">
            {textParts.map((part: string, idx: number) => {
              const isLast = idx === textParts.length - 1;
              const filledItem = filledBlanks[idx];
              const filledWord = filledItem?.word;
              const isRight = filledWord === correctAnswers[idx];

              let style = "border-dashed border-slate-300 bg-slate-50 text-slate-400";
              if (filledItem && !isChecked) style = "border-solid border-indigo-400 bg-indigo-100 text-indigo-700 shadow-lg scale-110 -translate-y-2 cursor-pointer hover:bg-rose-100 hover:border-rose-400 hover:text-rose-600";
              if (isChecked && isRight) style = "border-solid border-emerald-500 bg-emerald-100 text-emerald-700 shadow-lg";
              if (isChecked && !isRight) style = "border-solid border-rose-500 bg-rose-100 text-rose-700 shadow-lg cursor-pointer";

              return (
                <React.Fragment key={`part_${idx}`}>
                    <span className="mx-2 py-2">{String(part)}</span>
                    {!isLast && (
                        <button onClick={() => handleBlankClick(filledItem, idx)} disabled={isChecked} className={`min-w-[120px] h-16 px-6 mx-3 rounded-2xl border-4 flex items-center justify-center text-[3.5vh] font-bold transition-all duration-300 ${style}`}>
                            {filledWord || " "}
                        </button>
                    )}
                </React.Fragment>
              );
            })}
          </div>
          
          {isComplete && !isChecked && (
              <div className="mt-12 flex justify-center animate-in slide-in-from-bottom-4">
                  <button onClick={() => setIsChecked(true)} className="px-12 py-6 bg-slate-900 text-white rounded-2xl font-black text-[3vh] uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all hover:-translate-y-1">
                      Check Answers
                  </button>
              </div>
          )}
          
          {isChecked && (
              <div className="mt-12 flex justify-center animate-in zoom-in-95">
                  {isEntirelyCorrect ? (
                      <div className="px-12 py-6 bg-emerald-50 text-emerald-700 border-4 border-emerald-200 rounded-2xl font-black text-[3vh] uppercase tracking-widest flex items-center gap-3">
                          <CheckCircle2 size={32}/> Perfectly Placed!
                      </div>
                  ) : (
                      <button onClick={() => { 
                          setFilledBlanks(Array(correctAnswers.length).fill(null)); 
                          setWordBank(initialWordBank); 
                          setIsChecked(false); 
                      }} className="px-12 py-6 bg-rose-50 text-rose-600 border-4 border-rose-200 rounded-2xl font-black text-[3vh] uppercase tracking-widest shadow-sm hover:bg-rose-100 active:scale-95 transition-all">
                          Try Again
                      </button>
                  )}
              </div>
          )}
      </div>
    </div>
  );
};

type SortItem = { id: string; label: string; emoji: string };

const TapSortBlock = ({ block, liveState }: { block: any, liveState?: any }) => {
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
        <div className="w-full max-w-7xl mx-auto bg-white rounded-[4rem] border-4 border-slate-100 shadow-2xl my-12 flex flex-col relative overflow-visible pointer-events-auto">
            <div className="p-12 md:p-16 pb-8">
                <h3 className="text-[4vh] font-bold text-slate-800 flex items-center justify-center gap-4">
                    <span className="bg-amber-100 text-amber-600 p-4 rounded-2xl"><MousePointerClick size={40}/></span>
                    {String(block.title || 'Sort the Items!')}
                </h3>
            </div>

            <div className="sticky top-4 z-50 -mx-4 px-4 mb-12">
               <div className="bg-white/95 backdrop-blur-2xl rounded-[2.5rem] p-6 border-4 border-slate-200/50 shadow-[0_10px_40px_rgba(0,0,0,0.08)] flex flex-col items-center gap-3 max-h-[25vh] transition-all duration-300">
                   <span className="text-[2vh] font-black text-amber-500 uppercase tracking-widest text-center shrink-0">Items to Sort</span>
                   <div className="flex flex-wrap justify-center gap-4 overflow-y-auto custom-scrollbar w-full pb-2">
                        {items.length === 0 ? (
                            <p className="text-amber-500 font-bold uppercase tracking-widest my-auto flex items-center gap-2"><CheckCircle2 size={24}/> All sorted!</p>
                        ) : (
                            items.map((item: SortItem) => (
                                <button 
                                    key={item.id} 
                                    onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)} 
                                    className={`px-6 py-3 rounded-2xl font-black text-[2.5vh] transition-all duration-300 shadow-md border-4 ${selectedItem?.id === item.id ? 'bg-indigo-600 text-white scale-110 -translate-y-1 border-indigo-400' : 'bg-white text-slate-700 hover:scale-105 active:scale-95 border-slate-200 hover:border-amber-300'}`}
                                >
                                    {item.emoji} {item.label}
                                </button>
                            ))
                        )}
                   </div>
               </div>
            </div>

            <div className="px-12 md:px-16 pb-24 grid grid-cols-1 sm:grid-cols-2 gap-10 flex-1">
                {parsedCategories.map((cat: string) => {
                    const isPlacedEmpty = !placed[cat] || placed[cat].length === 0;
                    return (
                        <div 
                            key={cat} 
                            onClick={() => handleBucketClick(cat)} 
                            className={`p-8 rounded-[3rem] border-4 transition-colors duration-300 flex flex-col items-center gap-6 ${selectedItem ? 'border-indigo-400 bg-indigo-50 animate-pulse cursor-pointer shadow-xl' : 'border-amber-200 bg-amber-50 cursor-default'}`}
                        >
                            <h4 className="font-black text-amber-900 text-[4vh] text-center leading-tight">{cat}</h4>
                            <div className="flex flex-wrap justify-center gap-3">
                                {isPlacedEmpty ? (
                                    <span className="text-amber-400/50 text-[3vh] font-bold uppercase tracking-widest mt-4">Drop Zone</span>
                                ) : (
                                    (placed[cat] || []).map((item: SortItem) => (
                                        <div key={item.id} className="px-5 py-2.5 bg-white rounded-xl text-[2.5vh] font-black shadow-sm border-2 border-amber-100 flex items-center gap-2">
                                            {item.emoji} <span>{item.label}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
