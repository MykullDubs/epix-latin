// src/components/ClassView.tsx
import React, { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import { useLiveClass } from '../hooks/useLiveClass';
import { 
    MessageSquare, MessageCircle, Gamepad2, CheckCircle2, X, Puzzle, 
    ChevronLeft, ChevronRight, Zap, Users, Clock, EyeOff, HelpCircle, 
    Layers, MousePointerClick, QrCode, Hourglass, Play, Pause, RotateCcw, 
    Plus, Minus, PenTool, Crosshair, Eraser, Wrench, Highlighter, Type, Presentation,
    ChevronDown, ChevronUp, Mic, Info, Search, Palette, Square, BookOpen, Volume2,
    AlertCircle, Download, LayoutGrid, Check, Maximize, Keyboard, Monitor
} from 'lucide-react';
import ConnectThreeVocab from './ConnectThreeVocab';
import PronunciationLab from './PronunciationLab'; 
import LiveRoleplayArena from './LiveRoleplayArena';
import MarbleScrabble from './MarbleScrabble';

// ============================================================================
//  TYPES & UTILS
// ============================================================================
type Point = { x: number; y: number };
type Stroke = { id: string; points: Point[]; color: string; size: number; isEraser: boolean; style: string };

const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

// ============================================================================
//  MEMOIZED PERFORMANCE COMPONENTS (Clock, Footer, Timer)
// ============================================================================

const LiveClock = memo(() => {
    const [elapsed, setElapsed] = useState(0);
    useEffect(() => {
        const timer = setInterval(() => setElapsed(prev => prev + 1), 1000);
        return () => clearInterval(timer);
    }, []);
    const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const s = (elapsed % 60).toString().padStart(2, '0');
    return <span className="flex items-center gap-2 font-mono text-[clamp(14px,2vh,18px)] font-semibold text-slate-300"><Clock size={16} /> {m}:{s}</span>;
});

// ============================================================================
//  CLASS VIEW (The Projector / Big Screen Mode)
// ============================================================================
export default function ClassView({ lesson, classId, userData, activeOrg, onExit }: any) {
    const [activePageIdx, setActivePageIdx] = useState(0);
    const [slideDirection, setSlideDirection] = useState<'left'|'right'>('right');
    const [showForum, setShowForum] = useState(false);
    
    // UI Panels & Overlays
    const [isLobby, setIsLobby] = useState(true);
    const [isBlanked, setIsBlanked] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [showTools, setShowTools] = useState(false);
    const [showWhiteboard, setShowWhiteboard] = useState(false);
    const [showGrid, setShowGrid] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [wbBg, setWbBg] = useState<'dark'|'light'|'grid'|'lined'>('dark');
    const [wbPage, setWbPage] = useState(0);
    const [isIdle, setIsIdle] = useState(false);

    // Audio Roleplay
    const [activeRoleplayBlock, setActiveRoleplayBlock] = useState<any | null>(null);  
    
    // Timer
    const [showTimer, setShowTimer] = useState(false);
    const [timeLeft, setTimeLeft] = useState(300);
    const [timerRunning, setTimerRunning] = useState(false);
    const timerRef = useRef<HTMLDivElement>(null);

    // Spotlight & Tools
    const [isSpotlight, setIsSpotlight] = useState(false);
    const [spotlightSize, setSpotlightSize] = useState(150);
    const [spotlightDim, setSpotlightDim] = useState(0.85);
    const spotlightRef = useRef<HTMLDivElement>(null);
    const mainToolsRef = useRef<HTMLDivElement>(null);
    
    // Annotation Palette & State
    const [isAnnotating, setIsAnnotating] = useState(false);
    const [markerColor, setMarkerColor] = useState('#06b6d4');
    const [markerSize, setMarkerSize] = useState(6);
    const [markerStyle, setMarkerStyle] = useState<'pen' | 'highlighter' | 'text' | 'eraser'>('pen');
    const toolbarRef = useRef<HTMLDivElement>(null);
    
    // Stroke Histories for Undo/Redo/Persistence
    const [strokesByPage, setStrokesByPage] = useState<Record<number, Stroke[]>>({});
    const [wbStrokesByPage, setWbStrokesByPage] = useState<Record<number, Stroke[]>>({});
    const currentStroke = useRef<Stroke | null>(null);

    // Canvas Refs
    const classViewRef = useRef<HTMLDivElement>(null);
    const slideCanvasRef = useRef<HTMLCanvasElement>(null);
    const boardCanvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawing = useRef(false);

    const { liveState, startLiveClass, endLiveClass, changeSlide, triggerQuiz, updateLiveState } = useLiveClass(classId, true);

    const heroImage = useMemo(() => {
        if (!lesson?.blocks) return null;
        const imgBlock = lesson.blocks.find((b: any) => String(b.type) === 'image');
        return imgBlock ? (imgBlock.url || imgBlock.imageUrl) : null;
    }, [lesson]);

    const lessonVocab = useMemo(() => {
        if (!lesson?.blocks) return [];
        return lesson.blocks.filter((b: any) => String(b.type) === 'vocab-list').flatMap((b: any) => b.items || []);
    }, [lesson]);

    const pages = useMemo(() => {
        if (!lesson?.blocks || !Array.isArray(lesson.blocks)) return [];
        const grouped: any[] = [];
        let buffer: any[] = [];
        const interactables = ['quiz', 'flashcard', 'scenario', 'fill-blank', 'discussion', 'game', 'drag-drop', 'pronunciation', 'roleplay', 'audio-story', 'image-hotspot', 'drawing', 'code', 'timeline', 'grammar'];
        
        lesson.blocks.forEach((b: any) => {
            if (interactables.includes(String(b?.type || ''))) {
                if (buffer.length > 0) grouped.push({ type: 'read', blocks: [...buffer] });
                grouped.push({ type: 'interact', blocks: [b] });
                buffer = [];
            } else { buffer.push(b); }
        });
        if (buffer.length > 0) grouped.push({ type: 'read', blocks: [...buffer] });
        return grouped;
    }, [lesson]);

    // Wake Lock
    useEffect(() => {
        let wakeLock: any = null;
        const requestWakeLock = async () => {
            try { if ('wakeLock' in navigator) wakeLock = await (navigator as any).wakeLock.request('screen'); } catch (err) {}
        };
        requestWakeLock();
        return () => { if (wakeLock) wakeLock.release(); };
    }, []);

    // Idle Timer
    useEffect(() => {
        let timeout: NodeJS.Timeout;
        const resetIdle = () => {
            setIsIdle(false);
            clearTimeout(timeout);
            timeout = setTimeout(() => setIsIdle(true), 4000);
        };
        window.addEventListener('pointermove', resetIdle);
        window.addEventListener('keydown', resetIdle);
        resetIdle();
        return () => {
            window.removeEventListener('pointermove', resetIdle);
            window.removeEventListener('keydown', resetIdle);
            clearTimeout(timeout);
        };
    }, []);

    // Remote Control Sync
    useEffect(() => {
        if (liveState?.currentBlockIndex !== undefined && liveState.currentBlockIndex !== activePageIdx) {
            setSlideDirection(liveState.currentBlockIndex > activePageIdx ? 'right' : 'left');
            setActivePageIdx(liveState.currentBlockIndex);
            setIsLobby(false);
        } else if (isLobby && liveState?.started) {
            setIsLobby(false);
        }
    }, [liveState?.currentBlockIndex, liveState?.started]);

    // Initialize Class
    useEffect(() => {
        if (!lesson?.id) return;
        startLiveClass(lesson.id);
        updateLiveState({ started: false }); 

        if (timerRef.current) timerRef.current.style.transform = localStorage.getItem('timerPos') || `translate(${window.innerWidth - 350}px, 50px)`;
        if (toolbarRef.current) toolbarRef.current.style.transform = localStorage.getItem('toolbarPos') || `translate(${window.innerWidth / 2 - 250}px, 80px)`;
        if (mainToolsRef.current) mainToolsRef.current.style.transform = localStorage.getItem('toolsPos') || `translate(${window.innerWidth - 320}px, ${window.innerHeight - 500}px)`;

        return () => { endLiveClass(); };
    }, [lesson?.id]);

    // Timer Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timerRunning && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && timerRunning) {
            setTimerRunning(false);
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play().catch(() => {});
            setIsBlanked(true);
            setTimeout(() => setIsBlanked(false), 500);
        }
        return () => clearInterval(interval);
    }, [timerRunning, timeLeft]);

    // Canvas Resizing & Redrawing
    const redrawCanvas = useCallback(() => {
        const dpr = window.devicePixelRatio || 1;
        const targetCanvas = showWhiteboard ? boardCanvasRef.current : slideCanvasRef.current;
        if (!classViewRef.current || !targetCanvas) return;
        
        const rect = classViewRef.current.getBoundingClientRect();
        targetCanvas.width = rect.width * dpr;
        targetCanvas.height = rect.height * dpr;
        
        const ctx = targetCanvas.getContext('2d');
        if (!ctx) return;
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const strokes = showWhiteboard ? (wbStrokesByPage[wbPage] || []) : (strokesByPage[activePageIdx] || []);
        
        strokes.forEach(stroke => {
            if (stroke.points.length === 0) return;
            ctx.beginPath();
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = stroke.size;
            ctx.globalCompositeOperation = stroke.isEraser ? 'destination-out' : 'source-over';
            ctx.globalAlpha = stroke.style === 'highlighter' && !stroke.isEraser ? 0.4 : 1.0;
            
            ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
            stroke.points.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.stroke();
        });
        ctx.globalCompositeOperation = 'source-over'; 
        ctx.globalAlpha = 1.0;
    }, [activePageIdx, showWhiteboard, wbPage, strokesByPage, wbStrokesByPage]);

    useEffect(() => {
        window.addEventListener('resize', redrawCanvas);
        redrawCanvas();
        return () => window.removeEventListener('resize', redrawCanvas);
    }, [redrawCanvas]);

    // Draggable Logic using Refs
    const makeDraggable = (ref: React.RefObject<HTMLDivElement>, storageKey: string) => (e: React.PointerEvent) => {
        if (!ref.current) return;
        const el = ref.current;
        const startX = e.clientX;
        const startY = e.clientY;
        const transform = el.style.transform;
        const match = transform.match(/translate\(([^px]+)px,\s*([^px]+)px\)/);
        const initX = match ? parseFloat(match[1]) : 0;
        const initY = match ? parseFloat(match[2]) : 0;

        const onMove = (ev: PointerEvent) => {
            let newX = initX + (ev.clientX - startX);
            let newY = initY + (ev.clientY - startY);
            newX = clamp(newX, 0, window.innerWidth - 100);
            newY = clamp(newY, 0, window.innerHeight - 100);
            el.style.transform = `translate(${newX}px, ${newY}px)`;
        };
        const onUp = () => {
            localStorage.setItem(storageKey, el.style.transform);
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    };

    // Drawing Handlers
    const startAnnotation = (e: React.PointerEvent) => {
        if (!isAnnotating) return;
        const rect = classViewRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        isDrawing.current = true;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        currentStroke.current = {
            id: Date.now().toString(),
            points: [{ x, y }],
            color: markerStyle === 'eraser' ? '#000' : markerColor,
            size: markerStyle === 'highlighter' ? markerSize * 4 : markerStyle === 'eraser' ? 40 : markerSize,
            isEraser: markerStyle === 'eraser',
            style: markerStyle
        };
        
        const targetCanvas = showWhiteboard ? boardCanvasRef.current : slideCanvasRef.current;
        const ctx = targetCanvas?.getContext('2d');
        if (ctx) {
            ctx.beginPath();
            ctx.strokeStyle = currentStroke.current.color;
            ctx.lineWidth = currentStroke.current.size;
            ctx.globalCompositeOperation = currentStroke.current.isEraser ? 'destination-out' : 'source-over';
            ctx.globalAlpha = markerStyle === 'highlighter' && !currentStroke.current.isEraser ? 0.4 : 1.0;
            ctx.moveTo(x, y);
            ctx.lineTo(x, y);
            ctx.stroke();
        }
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const drawAnnotation = (e: React.PointerEvent) => {
        if (!isDrawing.current || !currentStroke.current) return;
        const rect = classViewRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        currentStroke.current.points.push({ x, y });

        const targetCanvas = showWhiteboard ? boardCanvasRef.current : slideCanvasRef.current;
        const ctx = targetCanvas?.getContext('2d');
        if (ctx) {
            ctx.lineTo(x, y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x, y);
        }
    };

    const stopAnnotation = (e: React.PointerEvent) => {
        if (!isDrawing.current) return;
        isDrawing.current = false;
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);

        if (currentStroke.current) {
            if (showWhiteboard) {
                setWbStrokesByPage(prev => ({ ...prev, [wbPage]: [...(prev[wbPage] || []), currentStroke.current!] }));
            } else {
                setStrokesByPage(prev => ({ ...prev, [activePageIdx]: [...(prev[activePageIdx] || []), currentStroke.current!] }));
            }
        }
        currentStroke.current = null;
    };

    const handleUndo = useCallback(() => {
        if (showWhiteboard) {
            setWbStrokesByPage(prev => {
                const arr = prev[wbPage] || [];
                return { ...prev, [wbPage]: arr.slice(0, -1) };
            });
        } else {
            setStrokesByPage(prev => {
                const arr = prev[activePageIdx] || [];
                return { ...prev, [activePageIdx]: arr.slice(0, -1) };
            });
        }
        setTimeout(redrawCanvas, 10);
    }, [showWhiteboard, wbPage, activePageIdx, redrawCanvas]);

    const downloadWhiteboard = () => {
        if (!boardCanvasRef.current) return;
        const link = document.createElement('a');
        link.download = `whiteboard-page-${wbPage + 1}.png`;
        link.href = boardCanvasRef.current.toDataURL('image/png');
        link.click();
    };

    const handleSpotlightMove = (e: React.PointerEvent) => {
        if (!isSpotlight || !spotlightRef.current || !classViewRef.current) return;
        const rect = classViewRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        spotlightRef.current.style.background = `radial-gradient(circle ${spotlightSize}px at ${x}px ${y}px, transparent 0%, rgba(0,0,0,${spotlightDim}) 100%)`;
    };

    const jumpToSlide = useCallback((index: number) => {
        if (index >= 0 && index < pages.length) {
            setSlideDirection(index > activePageIdx ? 'right' : 'left');
            setActivePageIdx(index);
            changeSlide(index);
        }
    }, [activePageIdx, pages.length, changeSlide]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement).tagName;
            if (['INPUT', 'TEXTAREA'].includes(tag) && e.key !== 'Escape') return; 
            
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                handleUndo();
                return;
            }

            if (activeRoleplayBlock) return;

            switch(e.key.toLowerCase()) {
                case 'arrowright':
                case ' ':
                    e.preventDefault(); 
                    if (isLobby) setIsLobby(false); else jumpToSlide(activePageIdx + 1);
                    break;
                case 'arrowleft':
                    e.preventDefault(); 
                    if (activePageIdx === 0 && !isLobby) setIsLobby(true); else jumpToSlide(activePageIdx - 1);
                    break;
                case 'f':
                    e.preventDefault(); document.documentElement.requestFullscreen().catch(()=>{}); break;
                case 'b':
                    e.preventDefault(); setIsBlanked(p => !p); break;
                case '?':
                    e.preventDefault(); setShowShortcuts(p => !p); break;
                case 'q':
                    e.preventDefault(); setShowQR(p => !p); setShowTools(false); break;
                case 't':
                    e.preventDefault(); setShowTimer(p => !p); setShowTools(false); break;
                case 'g':
                    e.preventDefault(); setShowGrid(p => !p); break;
                case 'a':
                    e.preventDefault(); 
                    setIsAnnotating(p => { if (!p) setIsSpotlight(false); return !p; }); 
                    setShowTools(false); break;
                case 's':
                    e.preventDefault(); 
                    setIsSpotlight(p => { if (!p) setIsAnnotating(false); return !p; }); 
                    setShowTools(false); break;
                case 'w':
                    e.preventDefault(); 
                    setShowWhiteboard(p => { if (!p) setIsAnnotating(true); return !p; }); 
                    setShowTools(false); break;
                case 'escape':
                    e.preventDefault();
                    if (showExitConfirm) { setShowExitConfirm(false); return; }
                    if (showShortcuts) { setShowShortcuts(false); return; }
                    if (showGrid) { setShowGrid(false); return; }
                    if (showQR) { setShowQR(false); return; }
                    if (showForum) { setShowForum(false); return; }
                    if (showTimer) { setShowTimer(false); return; }
                    if (showTools) { setShowTools(false); return; }
                    if (isAnnotating || isSpotlight || showWhiteboard) {
                        setIsAnnotating(false); setIsSpotlight(false); setShowWhiteboard(false); return;
                    }
                    break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activePageIdx, isLobby, jumpToSlide, handleUndo, activeRoleplayBlock, showExitConfirm, showShortcuts, showGrid, showQR, showForum, showTimer, showTools, isAnnotating, isSpotlight, showWhiteboard]);

    const activePage = pages[activePageIdx];
    if (!lesson || !lesson.blocks?.length) return <div className="h-screen bg-slate-950 flex items-center justify-center text-white text-2xl font-bold">No lesson content found.</div>;

    const joinUrl = `${window.location.origin}/play/${classId}`;
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div 
            ref={classViewRef}
            className={`fixed inset-0 z-[9999] flex flex-col bg-slate-950 text-white overflow-hidden font-sans selection:bg-indigo-500/30 ${isIdle && !isLobby && !isAnnotating && !showWhiteboard ? 'cursor-none' : ''}`}
            onContextMenu={(e) => { if (isAnnotating || isSpotlight) e.preventDefault(); }} 
        >
            {activeRoleplayBlock && (
                <LiveRoleplayArena 
                    scenarioPrompt={activeRoleplayBlock.prompt} 
                    tools={activeRoleplayBlock.metadata?.tools} 
                    onClose={() => setActiveRoleplayBlock(null)} 
                />
            )}

            <div className={`absolute inset-0 bg-black z-[9000] flex items-center justify-center transition-opacity duration-700 pointer-events-none ${isBlanked ? 'opacity-100' : 'opacity-0'}`}>
                <EyeOff size={64} className="text-white/10" />
            </div>

            {isSpotlight && (
                <div 
                    ref={spotlightRef}
                    className="absolute inset-0 z-[8500] pointer-events-auto touch-none"
                    onPointerMove={handleSpotlightMove}
                    onWheel={(e) => setSpotlightSize(p => clamp(p + e.deltaY * -0.5, 50, 600))}
                />
            )}

            {/* WHITEBOARD BACKGROUND */}
            <div 
                className={`absolute inset-0 z-[8550] transition-transform duration-500 ease-in-out pointer-events-none ${showWhiteboard ? 'translate-y-0' : '-translate-y-full'} ${wbBg === 'dark' ? 'bg-slate-900' : wbBg === 'light' ? 'bg-white' : wbBg === 'grid' ? 'bg-slate-900 bg-[radial-gradient(#334155_2px,transparent_2px)] [background-size:40px_40px]' : 'bg-slate-900 bg-[linear-gradient(transparent_39px,#334155_40px)] [background-size:100%_40px]'}`}
            >
                <canvas ref={boardCanvasRef} className="absolute inset-0 w-full h-full" />
                {showWhiteboard && (
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-800/90 p-2 rounded-full pointer-events-auto border border-slate-700">
                        <button onClick={() => setWbPage(p => Math.max(0, p - 1))} className="p-2 hover:bg-slate-700 rounded-full"><ChevronLeft size={20}/></button>
                        <span className="font-bold text-sm tracking-widest uppercase px-2">Page {wbPage + 1}</span>
                        <button onClick={() => setWbPage(p => p + 1)} className="p-2 hover:bg-slate-700 rounded-full"><ChevronRight size={20}/></button>
                        <div className="w-px h-6 bg-slate-600 mx-1"/>
                        <button onClick={() => setWbBg('dark')} className="w-6 h-6 rounded bg-slate-900 border border-slate-600"/>
                        <button onClick={() => setWbBg('light')} className="w-6 h-6 rounded bg-white border border-slate-400"/>
                        <button onClick={() => setWbBg('grid')} className="w-6 h-6 rounded bg-slate-900 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:4px_4px] border border-slate-600"/>
                        <div className="w-px h-6 bg-slate-600 mx-1"/>
                        <button onClick={downloadWhiteboard} title="Export as PNG" className="p-2 hover:bg-indigo-600 rounded-full text-indigo-300 hover:text-white"><Download size={20}/></button>
                    </div>
                )}
            </div>

            {/* SLIDE ANNOTATION LAYER */}
            <div className={`absolute inset-0 z-[8400] pointer-events-none overflow-hidden ${showWhiteboard ? 'opacity-0' : 'opacity-100'}`}>
                <canvas ref={slideCanvasRef} className="absolute inset-0 w-full h-full" />
            </div>

            {/* TOUCH-SAFE ROUTER PANE FOR DRAWING */}
            <div
                onPointerDown={startAnnotation}
                onPointerMove={drawAnnotation}
                onPointerUp={stopAnnotation}
                onPointerCancel={stopAnnotation}
                className={`absolute inset-0 z-[8600] touch-none ${isAnnotating ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none'}`}
            />

            {/* 🎨 FLOATING PALETTE */}
            {isAnnotating && (
                <div 
                    ref={toolbarRef}
                    className="absolute z-[8700] flex flex-col items-center pointer-events-auto animate-in fade-in zoom-in-95 duration-200"
                >
                    <div className="bg-slate-900/90 backdrop-blur-2xl p-3 pl-1 pr-4 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-700/50 flex flex-row gap-4 items-center">
                        <div className="h-16 w-8 cursor-grab active:cursor-grabbing flex justify-center items-center opacity-50 hover:opacity-100 transition-opacity bg-slate-800/50 rounded-l-full -ml-1 mr-1" onPointerDown={makeDraggable(toolbarRef, 'toolbarPos')} aria-label="Drag Palette">
                            <div className="w-1.5 h-8 bg-slate-400 rounded-full" />
                        </div>
                        <div className="flex flex-row gap-2 bg-slate-800/50 p-2 rounded-3xl items-center border border-slate-700/50">
                            <button aria-label="Pen Tool" onClick={() => setMarkerStyle('pen')} className={`p-3 rounded-2xl transition-all ${markerStyle === 'pen' ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.6)]' : 'text-slate-400 hover:text-white'}`}><PenTool size={24} strokeWidth={2.5}/></button>
                            <button aria-label="Highlighter Tool" onClick={() => setMarkerStyle('highlighter')} className={`p-3 rounded-2xl transition-all ${markerStyle === 'highlighter' ? 'bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.6)]' : 'text-slate-400 hover:text-white'}`}><Highlighter size={24} strokeWidth={2.5}/></button>
                            <button aria-label="Eraser Tool" onClick={() => setMarkerStyle('eraser')} className={`p-3 rounded-2xl transition-all ${markerStyle === 'eraser' ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.6)]' : 'text-slate-400 hover:text-white'}`}><Eraser size={24} strokeWidth={2.5}/></button>
                        </div>
                        <div className="w-px h-10 bg-slate-700" />
                        <div className="flex flex-row gap-2">
                            {['#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#a855f7', '#ffffff'].map(c => (
                                <button aria-label={`Color ${c}`} key={c} onClick={() => setMarkerColor(c)} className={`w-10 h-10 rounded-full transition-all border-2 ${markerColor === c && markerStyle !== 'eraser' ? 'scale-125 border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]' : 'border-slate-800 hover:scale-110 shadow-sm'}`} style={{ backgroundColor: c }} />
                            ))}
                        </div>
                        <div className="w-px h-10 bg-slate-700" />
                        <div className="flex flex-row items-center gap-2 bg-slate-800/50 p-2 rounded-3xl border border-slate-700/50">
                            {[4, 8, 14].map(s => (
                                <button aria-label={`Size ${s}`} key={s} onClick={() => setMarkerSize(s)} className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-colors ${markerSize === s ? 'bg-slate-700' : 'hover:bg-slate-700/50'}`}>
                                    <div className="rounded-full bg-slate-300 transition-all" style={{ width: s, height: s }} />
                                </button>
                            ))}
                        </div>
                        <div className="w-px h-10 bg-slate-700" />
                        <button onClick={handleUndo} title="Undo (Ctrl+Z)" className="bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white p-4 rounded-full transition-all flex items-center justify-center border border-slate-700/50"><RotateCcw size={20} strokeWidth={2.5}/></button>
                        <button onClick={() => { setIsAnnotating(false); setShowWhiteboard(false); }} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-full font-bold uppercase tracking-wider ml-2 shadow-lg">Done</button>
                    </div>
                </div>
            )}

            {/* MOVEABLE MAIN TOOLS */}
            {showTools && (
                <div 
                    ref={mainToolsRef}
                    className="absolute z-[8900] bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-[2.5rem] p-6 pt-10 pb-8 shadow-[0_40px_80px_rgba(0,0,0,0.6)] flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200 w-80 pointer-events-auto"
                >
                    <div className="absolute top-0 left-0 right-0 h-10 cursor-grab active:cursor-grabbing flex justify-center items-center opacity-50 hover:opacity-100 transition-opacity bg-slate-800/50" onPointerDown={makeDraggable(mainToolsRef, 'toolsPos')} aria-label="Drag Tools">
                        <div className="w-16 h-1.5 bg-slate-400 rounded-full" />
                    </div>
                    <div className="flex items-center justify-between mb-2 px-2">
                        <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Smartboard Tools</span>
                        <button aria-label="Close tools" onClick={() => setShowTools(false)} className="text-slate-500 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"><X size={20} strokeWidth={2.5} /></button>
                    </div>
                    <button onClick={() => { setShowQR(true); setShowTools(false); }} className="flex items-center min-h-[48px] gap-4 px-6 py-4 bg-slate-800/50 hover:bg-indigo-600 text-white rounded-2xl transition-all font-bold border border-slate-700/50 text-left focus-visible:ring-2 focus-visible:ring-white">
                        <QrCode size={20} /> <span className="flex-1">QR Code Menu</span> <span className="text-slate-500 text-xs font-bold">Q</span>
                    </button>
                    <button onClick={() => { setShowTimer(p => !p); setShowTools(false); }} className={`flex items-center min-h-[48px] gap-4 px-6 py-4 rounded-2xl transition-all font-bold border text-left focus-visible:ring-2 focus-visible:ring-white ${showTimer ? 'bg-amber-600 text-white border-amber-500/50' : 'bg-slate-800/50 hover:bg-amber-600 text-slate-300 hover:text-white border-slate-700/50'}`}>
                        <Hourglass size={20} /> <span className="flex-1">Focus Timer</span> <span className="text-amber-500/50 text-xs font-bold">T</span>
                    </button>
                    <button onClick={() => { setIsAnnotating(p => !p); setIsSpotlight(false); setShowTools(false); }} className={`flex items-center min-h-[48px] gap-4 px-6 py-4 rounded-2xl transition-all font-bold border text-left focus-visible:ring-2 focus-visible:ring-white ${isAnnotating ? 'bg-rose-600 text-white border-rose-500/50' : 'bg-slate-800/50 hover:bg-rose-600 text-slate-300 hover:text-white border-slate-700/50'}`}>
                        <PenTool size={20} /> <span className="flex-1">Digital Tools</span> <span className="text-rose-500/50 text-xs font-bold">A</span>
                    </button>
                    <button onClick={() => { setShowWhiteboard(p => !p); setIsAnnotating(true); setShowTools(false); }} className={`flex items-center min-h-[48px] gap-4 px-6 py-4 rounded-2xl transition-all font-bold border text-left focus-visible:ring-2 focus-visible:ring-white ${showWhiteboard ? 'bg-blue-600 text-white border-blue-500/50' : 'bg-slate-800/50 hover:bg-blue-600 text-slate-300 hover:text-white border-slate-700/50'}`}>
                        <Presentation size={20} /> <span className="flex-1">Whiteboard</span> <span className="text-blue-500/50 text-xs font-bold">W</span>
                    </button>
                    <button onClick={() => { setIsSpotlight(p => !p); setIsAnnotating(false); setShowTools(false); }} className={`flex items-center min-h-[48px] gap-4 px-6 py-4 rounded-2xl transition-all font-bold border text-left focus-visible:ring-2 focus-visible:ring-white ${isSpotlight ? 'bg-emerald-600 text-white border-emerald-500/50' : 'bg-slate-800/50 hover:bg-emerald-600 text-slate-300 hover:text-white border-slate-700/50'}`}>
                        <Crosshair size={20} /> <span className="flex-1">Spotlight</span> <span className="text-emerald-500/50 text-xs font-bold">S</span>
                    </button>
                </div>
            )}

            {/* FULLSCREEN QR OVERLAY */}
            {showQR && (
                <div className="absolute inset-0 z-[9999] bg-slate-950/95 backdrop-blur-3xl flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300 pointer-events-auto">
                    <button aria-label="Close QR" onClick={() => setShowQR(false)} className="absolute top-12 right-12 p-5 bg-white/10 hover:bg-rose-500 rounded-full text-white transition-all"><X size={32} strokeWidth={2.5} /></button>
                    <h2 className="text-[6vh] font-bold text-white uppercase tracking-widest mb-4">Join Live Session</h2>
                    <div className="p-10 bg-white rounded-[3rem] shadow-[0_0_100px_rgba(99,102,241,0.4)] border-8 border-indigo-500/20 mb-12">
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(joinUrl)}&margin=10`} alt="Join QR" className="w-[40vh] h-[40vh] object-contain" />
                    </div>
                    <div className="text-center">
                        <p className="text-[2.5vh] font-bold text-slate-400 uppercase tracking-[0.4em] mb-4">Room Code</p>
                        <div className="text-[10vh] font-black text-indigo-400 tracking-[0.2em] leading-none bg-indigo-500/10 py-6 px-16 rounded-[2.5rem] border border-indigo-500/30">{String(classId || '').substring(0,6).toUpperCase()}</div>
                    </div>
                </div>
            )}

            {/* DRAGGABLE TIMER */}
            {showTimer && (
                <div ref={timerRef} className="absolute z-[9500] bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 pointer-events-auto w-[320px]">
                    <div className="bg-slate-800/80 p-3 border-b border-slate-700/50 cursor-grab active:cursor-grabbing flex justify-between items-center" onPointerDown={makeDraggable(timerRef, 'timerPos')}>
                        <div className="flex items-center gap-2 text-slate-400 px-2"><Hourglass size={14} /><span className="text-[10px] font-bold uppercase tracking-widest">Focus Timer</span></div>
                        <button aria-label="Close Timer" onClick={() => setShowTimer(false)} className="text-slate-400 hover:text-rose-400 p-1"><X size={18} strokeWidth={2.5} /></button>
                    </div>
                    <div className="p-8 flex flex-col items-center">
                        <div className={`text-7xl font-bold font-mono tracking-tighter mb-6 ${timeLeft === 0 ? 'text-rose-500 motion-safe:animate-pulse' : 'text-white'}`}>{formatTime(timeLeft)}</div>
                        <div className="grid grid-cols-4 gap-2 w-full mb-4">
                            {[1, 3, 5, 10].map(m => (
                                <button key={m} onClick={() => setTimeLeft(m * 60)} className="py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 font-semibold text-sm transition-all">{m}m</button>
                            ))}
                        </div>
                        <div className="flex gap-3 w-full mt-2">
                            <button onClick={() => { setTimeLeft(300); setTimerRunning(false); }} className="p-4 bg-slate-800 border border-slate-700 hover:bg-rose-500/20 text-slate-400 rounded-xl transition-all w-1/3 flex justify-center"><RotateCcw size={20}/></button>
                            <button onClick={() => setTimerRunning(!timerRunning)} className={`p-4 rounded-xl font-bold uppercase tracking-widest flex justify-center items-center gap-2 transition-all w-2/3 ${timerRunning ? 'bg-amber-500 text-slate-900' : 'bg-emerald-500 text-white'}`}>
                                {timerRunning ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1"/>}
                                {timerRunning ? 'Pause' : 'Start'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EXIT CONFIRMATION MODAL */}
            {showExitConfirm && (
                <div className="absolute inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center pointer-events-auto">
                    <div className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 shadow-2xl max-w-md w-full text-center">
                        <AlertCircle size={64} className="text-rose-500 mx-auto mb-6" />
                        <h3 className="text-3xl font-bold text-white mb-4">End Session?</h3>
                        <p className="text-slate-400 mb-8">This will disconnect all students and close the presentation.</p>
                        <div className="flex gap-4">
                            <button onClick={() => setShowExitConfirm(false)} className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold transition-colors">Cancel</button>
                            <button onClick={onExit} className="flex-1 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-bold transition-colors">End Session</button>
                        </div>
                    </div>
                </div>
            )}

            {/* SHORTCUTS OVERLAY */}
            {showShortcuts && (
                <div className="absolute inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center pointer-events-auto" onClick={() => setShowShortcuts(false)}>
                    <div className="bg-slate-900 p-12 rounded-[3rem] border border-slate-800 shadow-2xl max-w-2xl w-full" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-3xl font-bold text-white flex items-center gap-3"><Keyboard className="text-indigo-500"/> Keyboard Shortcuts</h3>
                            <button onClick={() => setShowShortcuts(false)} className="text-slate-400 hover:text-white"><X size={28}/></button>
                        </div>
                        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                            {[
                                { k: 'Space / Right', l: 'Next Slide' }, { k: 'Left', l: 'Previous Slide' },
                                { k: 'W', l: 'Whiteboard' }, { k: 'A', l: 'Annotate' },
                                { k: 'S', l: 'Spotlight' }, { k: 'T', l: 'Timer' },
                                { k: 'Q', l: 'QR Code' }, { k: 'B', l: 'Blackout Screen' },
                                { k: 'G', l: 'Slide Grid' }, { k: 'F', l: 'Fullscreen' },
                                { k: 'Ctrl+Z', l: 'Undo Drawing' }, { k: 'Esc', l: 'Close Top Overlay' },
                            ].map(sc => (
                                <div key={sc.k} className="flex justify-between items-center border-b border-slate-800 pb-3">
                                    <span className="text-slate-300 text-lg font-medium">{sc.l}</span>
                                    <span className="bg-slate-800 text-indigo-300 font-mono px-3 py-1 rounded-lg text-sm border border-slate-700">{sc.k}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* SLIDE GRID OVERLAY */}
            {showGrid && (
                <div className="absolute inset-0 z-[9999] bg-slate-950/95 backdrop-blur-xl p-12 overflow-y-auto pointer-events-auto">
                    <div className="flex items-center justify-between mb-12 max-w-7xl mx-auto">
                        <h3 className="text-4xl font-bold text-white flex items-center gap-4"><LayoutGrid className="text-indigo-500"/> Slide Overview</h3>
                        <button onClick={() => setShowGrid(false)} className="p-4 bg-slate-800 hover:bg-rose-500 rounded-full text-white transition-colors"><X size={28}/></button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
                        {pages.map((p, idx) => (
                            <button 
                                key={idx} 
                                onClick={() => { jumpToSlide(idx); setShowGrid(false); }}
                                className={`aspect-video rounded-2xl border-4 flex flex-col items-center justify-center p-4 transition-all hover:scale-105 ${activePageIdx === idx ? 'border-indigo-500 bg-indigo-500/20' : 'border-slate-800 bg-slate-900 hover:border-slate-600'}`}
                            >
                                <span className="text-4xl font-black text-slate-600 mb-2">{idx + 1}</span>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{p.type}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* CORE PRESENTATION LAYER */}
            <main className="flex-1 flex overflow-hidden relative group/canvas bg-slate-950 text-white z-0 w-full h-full">
                {(!isLobby && activePageIdx > 0) && (
                    <button aria-label="Previous Slide" onClick={() => jumpToSlide(activePageIdx - 1)} className="absolute left-6 top-1/2 -translate-y-1/2 z-50 p-4 bg-slate-800/50 hover:bg-slate-700 border border-slate-600 text-white rounded-full backdrop-blur-md opacity-0 group-hover/canvas:opacity-100 transition-all duration-300 hover:scale-110 shadow-xl min-w-[48px] min-h-[48px] flex items-center justify-center"><ChevronLeft size={32}/></button>
                )}
                {(isLobby || activePageIdx < pages.length - 1) && (
                    <button aria-label="Next Slide" onClick={() => { if (isLobby) setIsLobby(false); else jumpToSlide(activePageIdx + 1); }} className="absolute right-6 top-1/2 -translate-y-1/2 z-50 p-4 bg-slate-800/50 hover:bg-slate-700 border border-slate-600 text-white rounded-full backdrop-blur-md opacity-0 group-hover/canvas:opacity-100 transition-all duration-300 hover:scale-110 shadow-xl min-w-[48px] min-h-[48px] flex items-center justify-center"><ChevronRight size={32}/></button>
                )}

                {/* LOBBY SCREEN */}
                {isLobby ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-700 relative bg-slate-950 text-white z-10">
                        {heroImage ? (
                            <div className="w-full max-w-5xl aspect-video rounded-[3rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] mb-10 border border-slate-800 relative">
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent z-10" />
                                <img src={heroImage} alt="Lesson Cover" className="w-full h-full object-cover" />
                            </div>
                        ) : (
                            <div className="w-40 h-40 bg-indigo-500/10 rounded-[3rem] flex items-center justify-center mb-10 border border-indigo-500/20 shadow-2xl">
                                <Monitor size={64} className="text-indigo-400" strokeWidth={1.5}/>
                            </div>
                        )}
                        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-6 relative z-20 drop-shadow-lg">{lesson.title || 'Untitled Lesson'}</h1>
                        
                        <div className="flex gap-8 items-center bg-slate-900/80 p-6 rounded-[2.5rem] border border-slate-800 backdrop-blur-md mb-12 relative z-20">
                            <div className="text-left px-4 border-r border-slate-700">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Room Code</p>
                                <div className="text-4xl font-black text-indigo-400 tracking-[0.2em] leading-none">{String(classId || '').substring(0,6).toUpperCase()}</div>
                            </div>
                            <div className="flex items-center gap-4 px-4 text-emerald-400">
                                <Users size={32} className="motion-safe:animate-pulse" />
                                <div className="text-left">
                                    <p className="text-xs font-bold text-emerald-500/70 uppercase tracking-widest mb-1">Status</p>
                                    <div className="text-2xl font-bold leading-none">{Object.keys(liveState?.students || {}).length} Joined</div>
                                </div>
                            </div>
                        </div>

                        <button onClick={() => setIsLobby(false)} className="px-10 py-4 bg-white/10 hover:bg-white text-white hover:text-slate-900 border border-white/20 hover:scale-105 active:scale-95 rounded-full font-bold text-sm uppercase tracking-widest transition-all shadow-lg flex items-center gap-3 relative z-20 min-h-[48px]">
                            Start Broadcast <Zap size={18} fill="currentColor" />
                        </button>
                    </div>
                ) : (
                    <div className={`flex-1 overflow-y-auto w-full relative transition-all duration-500 ${showForum ? 'mr-[450px]' : ''} scroll-smooth`}>
                        <div className="flex flex-col min-h-full w-full items-center px-12 py-12 lg:px-24 pb-32">
                            {/* Directional transition logic via key */}
                            <div key={`${activePageIdx}`} className={`w-full max-w-7xl my-auto flex flex-col gap-12 animate-in fade-in duration-500 ${slideDirection === 'right' ? 'slide-in-from-right-16' : 'slide-in-from-left-16'}`}>
                                {activePage.blocks.map((block: any, i: number) => {
                                    if (!block) return null;
                                    const blockType = String(block.type || '');
                                    const isQuiz = blockType === 'quiz';

                                    return (
                                        <div key={`${activePageIdx}-${i}`} className="w-full">
                                            {isQuiz ? <QuizBlock block={block} liveState={liveState} triggerQuiz={triggerQuiz} /> : (
                                                <>
                                                    {blockType === 'text' && <TextBlock block={block} />}
                                                    {blockType === 'essay' && <EssayBlock block={block} />}
                                                    {blockType === 'image' && <ImageBlock block={block} />}
                                                    {blockType === 'dialogue' && <DialogueBlock block={block} />}
                                                    {blockType === 'vocab-list' && <VocabListBlock block={block} />}
                                                    {blockType === 'discussion' && <DiscussionBlock block={block} />}
                                                    {blockType === 'game' && block.gameType === 'connect-three' && <GameBlock block={block} lessonVocab={lessonVocab} />}
                                                    {blockType === 'game' && block.gameType === 'marble-scrabble' && (
                                                        <div className="w-full h-[80vh] pointer-events-auto rounded-[3rem] overflow-hidden shadow-2xl border border-slate-800">
                                                            <MarbleScrabble block={block} isProjector={true} liveState={liveState} onUpdateLiveState={updateLiveState} studentId="projector" />
                                                        </div>
                                                    )}
                                                    {blockType === 'scenario' && <ScenarioBlock block={block} liveState={liveState} />}
                                                    {blockType === 'callout' && <CalloutBlock block={block} />}
                                                    {blockType === 'drawing' && <DrawingBlock block={block} liveState={liveState} />}
                                                    {blockType === 'image-hotspot' && <ImageHotspotBlock block={block} />}
                                                    {blockType === 'audio-story' && <AudioStoryBlock block={block} />}
                                                    {blockType === 'code' && <CodeBlock block={block} />}
                                                    {blockType === 'timeline' && <TimelineBlock block={block} />}
                                                    {blockType === 'fill-blank' && <FillBlankBlock block={block} liveState={liveState} />}
                                                    {blockType === 'drag-drop' && <TapSortBlock block={block} liveState={liveState} />}
                                                    {blockType === 'pronunciation' && <PronunciationLab block={block} />} 
                                                    {blockType === 'grammar' && <GrammarBlock block={block} />} 
                                                    {blockType === 'roleplay' && <LiveRoleplayBlock block={block} onLaunch={() => setActiveRoleplayBlock(block)} />}
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* FORUM OVERLAY */}
                {showForum && (
                    <aside className="absolute right-0 top-0 bottom-0 w-[450px] bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 p-8 z-[8800] animate-in slide-in-from-right shadow-2xl flex flex-col pointer-events-auto">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-bold flex items-center gap-2"><MessageSquare className="text-indigo-500"/> FORUM</h3>
                            <button onClick={() => setShowForum(false)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg"><X size={20}/></button>
                        </div>
                        <div className="flex-1 flex items-center justify-center text-slate-500 font-medium">Class chat unavailable.</div>
                    </aside>
                )}
            </main>

            {/* FOOTER */}
            <footer className={`absolute bottom-0 left-0 right-0 h-[72px] bg-slate-900/90 backdrop-blur-xl border-t border-slate-800/60 flex items-center justify-between px-6 shrink-0 z-[8800] transition-transform duration-500 ${isIdle && !isLobby && !isAnnotating && !showWhiteboard ? 'translate-y-full' : 'translate-y-0'}`}>
                <div className="flex items-center gap-6">
                    <h2 className="text-[clamp(12px,1.8vh,16px)] font-bold text-slate-300 uppercase tracking-wider hidden sm:block">{String(lesson?.title || '')}</h2>
                    <div className="h-5 w-px bg-slate-700 hidden sm:block" />
                    <LiveClock />
                    
                    {timerRunning && !showTimer && (
                        <div className="flex items-center gap-2 bg-rose-500/20 text-rose-400 px-3 py-1.5 rounded-lg border border-rose-500/30 text-sm font-bold ml-2 cursor-pointer hover:bg-rose-500/30 transition-colors pointer-events-auto" onClick={() => setShowTimer(true)}>
                            <Hourglass size={14} className="motion-safe:animate-pulse" /> {Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2,'0')}
                        </div>
                    )}
                </div>
                
                <div className="flex items-center gap-4 pointer-events-auto">
                    <button aria-label="Toggle Forum" onClick={() => setShowForum(p => !p)} className={`p-3 rounded-xl transition-all shadow-sm border min-w-[48px] min-h-[48px] flex items-center justify-center ${showForum ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'}`}>
                        <MessageSquare size={20} strokeWidth={2.5}/>
                    </button>
                    <button aria-label="Toggle Tools" onClick={() => setShowTools(p => !p)} className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all text-[clamp(12px,1.5vh,14px)] font-bold uppercase tracking-wider shadow-sm border min-h-[48px] ${showTools || isAnnotating || isSpotlight || showTimer || isBlanked || showWhiteboard ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-500/20' : 'bg-slate-800 hover:bg-indigo-600/80 text-slate-300 hover:text-white border-slate-700'}`}>
                        <Wrench size={16} strokeWidth={2.5}/> <span className="hidden sm:inline">Tools (W)</span>
                    </button>
                    <button aria-label="End Session" onClick={() => setShowExitConfirm(true)} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors border border-rose-500/20 hover:border-rose-500 font-bold text-[clamp(12px,1.5vh,14px)] uppercase tracking-wider min-h-[48px]">
                        <X size={16} strokeWidth={3} /> <span className="hidden sm:inline">End</span>
                    </button>
                    <div className="h-8 w-px bg-slate-700 mx-2" />
                    
                    <div className="flex items-center gap-4">
                        <div onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const p = (e.clientX - rect.left) / rect.width;
                            jumpToSlide(Math.min(pages.length - 1, Math.floor(p * pages.length)));
                        }} className="w-32 md:w-64 h-3 bg-slate-800 rounded-full overflow-hidden cursor-pointer group relative border border-slate-700 shadow-inner min-h-[16px]">
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${isLobby ? 0 : ((activePageIdx + 1) / pages.length) * 100}%` }} />
                        </div>
                        <span className="font-bold text-slate-400 tracking-wider uppercase w-28 text-right text-[clamp(12px,1.5vh,14px)]">
                            {isLobby ? 'LOBBY' : `Slide ${activePageIdx + 1} of ${pages.length}`}
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// ============================================================================
//  INTERNAL BLOCK RENDERERS (Memoized for Performance)
// ============================================================================

const TextBlock = memo(({ block }: { block: any }) => (
    <div className="text-center py-12 max-w-6xl mx-auto">
        {block.title && <h3 className="text-[3vh] font-bold text-indigo-500 uppercase tracking-wider mb-6">{String(block.title)}</h3>}
        <p className="text-[6vh] font-bold text-slate-100 leading-[1.2] tracking-tight">{String(block.content || '')}</p>
    </div>
));

const EssayBlock = memo(({ block }: { block: any }) => (
    <div className="w-full max-w-7xl mx-auto py-12">
        <h1 className="text-[7vh] font-bold text-white leading-none mb-16 text-center tracking-tight">{String(block.title || '')}</h1>
        <div className="columns-1 xl:columns-2 gap-20 space-y-[4vh]">
            {String(block.content || '').split('\n\n').map((para: string, pIdx: number) => (
                <p key={pIdx} className="text-[3.5vh] leading-[1.7] text-slate-300 font-serif text-justify first-letter:text-[7vh] first-letter:font-bold first-letter:text-indigo-400 first-letter:float-left first-letter:mr-4 break-inside-avoid">{para.trim()}</p>
            ))}
        </div>
    </div>
));

const ImageBlock = memo(({ block }: { block: any }) => {
    const [zoomed, setZoomed] = useState(false);
    return (
        <figure className="w-full flex flex-col items-center py-12 pointer-events-auto">
            <div className="relative group overflow-hidden rounded-[3rem] shadow-2xl border border-slate-800 bg-slate-900/50 cursor-pointer" onClick={() => setZoomed(!zoomed)}>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                    <Maximize size={48} className="text-white drop-shadow-lg" />
                </div>
                <img src={String(block.url || block.imageUrl || '')} alt={String(block.caption || 'Presentation Image')} className="max-h-[65vh] max-w-full object-contain transition-transform duration-700 hover:scale-[1.02]" />
            </div>
            {block.caption && <figcaption className="text-[3vh] text-slate-400 font-semibold mt-8 text-center max-w-4xl tracking-wider uppercase">{String(block.caption)}</figcaption>}
            
            {zoomed && (
                <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-8 cursor-zoom-out" onClick={() => setZoomed(false)}>
                    <img src={String(block.url || block.imageUrl || '')} alt="Zoomed" className="max-w-full max-h-full object-contain animate-in zoom-in-95 duration-200" />
                </div>
            )}
        </figure>
    );
});

const CalloutBlock = memo(({ block }: { block: any }) => (
    <div className="my-12 p-12 md:p-16 rounded-[4rem] bg-amber-500/10 border border-amber-500/20 relative overflow-hidden group shadow-lg max-w-6xl mx-auto w-full transition-colors">
        <Zap size={200} className="absolute -right-8 -top-8 text-amber-500/10 rotate-12 group-hover:scale-110 transition-transform duration-700" fill="currentColor" aria-hidden="true" />
        <div className="relative z-10 flex flex-col items-center text-center">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl shadow-sm"><Info size={32} strokeWidth={2.5} /></div>
                <span className="text-[3vh] font-bold text-amber-500 uppercase tracking-wider">{String(block.label || block.title || 'Spotlight')}</span>
            </div>
            <p className="text-[4.5vh] text-white font-semibold leading-relaxed italic max-w-4xl">"{String(block.content || block.text || '')}"</p>
        </div>
    </div>
));

const AudioStoryBlock = memo(({ block }: { block: any }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const text = String(block.text || "The legend says they looked for an eagle on a cactus...");
    
    const handlePlay = () => {
        if (!isPlaying) {
            const u = new SpeechSynthesisUtterance(text);
            u.onend = () => setIsPlaying(false);
            window.speechSynthesis.speak(u);
            setIsPlaying(true);
        } else {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
        }
    };

    useEffect(() => () => window.speechSynthesis.cancel(), []);

    return (
        <div className="bg-slate-900 rounded-[4rem] overflow-hidden shadow-2xl border border-slate-800 my-12 w-full max-w-6xl mx-auto transition-colors pointer-events-auto">
            <div className="relative">
                <img src={String(block.imageUrl || 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?q=80&w=800&auto=format&fit=crop')} alt="Story visual" className="w-full h-[45vh] object-cover" />
                <button aria-label="Play Audio" onClick={handlePlay} className={`absolute -bottom-12 right-16 w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 border-4 border-slate-900 ${isPlaying ? 'bg-rose-500 text-white scale-110' : 'bg-indigo-600 text-white hover:scale-105'}`}>
                    {isPlaying ? <Square fill="currentColor" size={36} /> : <Play fill="currentColor" size={44} className="ml-2" />}
                </button>
            </div>
            <div className="p-12 md:p-16 pt-20">
                <h3 className="text-[2vh] font-bold text-indigo-400 uppercase tracking-wider mb-6 flex items-center gap-3"><Volume2 size={24} strokeWidth={2.5}/> Read Along</h3>
                <p className={`text-[5vh] font-bold text-slate-100 leading-snug tracking-tight transition-colors duration-500 ${isPlaying ? 'text-indigo-400' : ''}`}>{text}</p>
            </div>
        </div>
    );
});

const ImageHotspotBlock = memo(({ block }: { block: any }) => {
    const [activeSpot, setActiveSpot] = useState<number | null>(null);
    return (
        <div className="bg-slate-900 p-12 rounded-[4rem] shadow-2xl my-12 w-full max-w-7xl mx-auto border border-slate-800 pointer-events-auto">
            <div className="flex items-center justify-center gap-4 mb-10"><Search className="text-cyan-400" size={40} strokeWidth={2.5}/><h3 className="text-[5vh] font-bold text-white text-center tracking-tight">{String(block.title || 'Explore the Map!')}</h3></div>
            <div className="relative rounded-[3rem] overflow-hidden border border-slate-800 bg-black">
                <img src={String(block.imageUrl || 'https://images.unsplash.com/photo-1565670119853-23910c2830f3?q=80&w=800&auto=format&fit=crop')} className="w-full h-auto opacity-70 object-contain" alt="Explorer Map" />
                {(Array.isArray(block.hotspots) ? block.hotspots : []).map((spot: any, i: number) => (
                    <React.Fragment key={i}>
                        <button aria-label={`Hotspot ${i+1}`} onClick={() => setActiveSpot(activeSpot === i ? null : i)} className="absolute w-16 h-16 bg-rose-500 rounded-full border-4 border-white shadow-[0_0_25px_rgba(244,63,94,0.7)] flex items-center justify-center motion-safe:animate-pulse hover:scale-110 transition-transform z-10 min-h-[48px] min-w-[48px]" style={{ top: `${spot.y || 0}%`, left: `${spot.x || 0}%`, transform: 'translate(-50%, -50%)' }}>
                            <Search size={28} className="text-white" strokeWidth={2.5} />
                        </button>
                        {activeSpot === i && (
                            <div className="absolute z-20 bg-white/95 backdrop-blur-md p-8 rounded-[2.5rem] shadow-2xl w-96 text-center animate-in zoom-in-95 duration-200 border border-slate-200/50" style={{ top: `${spot.y || 0}%`, left: `${spot.x || 0}%`, transform: 'translate(-50%, -115%)' }}>
                                <h4 className="text-[3.5vh] font-bold text-indigo-700 mb-3 leading-tight tracking-tight">{String(spot.title || '')}</h4>
                                <p className="text-[2.2vh] font-medium text-slate-600 leading-relaxed">{String(spot.description || '')}</p>
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white/95 border-r border-b border-slate-200/50 rotate-45"></div>
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
});

const DrawingBlock = memo(({ block, liveState }: { block: any, liveState: any }) => {
    const finishedCount = Object.keys(liveState?.drawings || {}).length;
    const totalCount = Object.keys(liveState?.students || {}).length || 1;
    return (
        <div className="bg-slate-900 p-16 rounded-[4rem] border border-slate-800 shadow-2xl my-12 w-full max-w-6xl mx-auto text-center flex flex-col items-center transition-colors">
            <div className="inline-flex items-center justify-center p-8 bg-fuchsia-500/10 text-fuchsia-500 border border-fuchsia-500/20 rounded-[3rem] mb-10 shadow-sm"><Palette size={64} strokeWidth={2}/></div>
            <h3 className="text-[7vh] font-bold text-white leading-none tracking-tight mb-8">{String(block.title || "Let's Draw!")}</h3>
            <div className="bg-slate-800 px-8 py-4 rounded-2xl border border-slate-700 flex items-center gap-4">
                <span className="text-[3vh] font-bold text-slate-400 uppercase tracking-widest">Look at your device</span>
                <div className="h-8 w-px bg-slate-600" />
                <span className="text-[3vh] font-bold text-fuchsia-400">{finishedCount}/{totalCount} Finished</span>
            </div>
        </div>
    );
});

const DialogueBlock = memo(({ block }: { block: any }) => {
    const lines = Array.isArray(block.lines) ? block.lines : [];
    const [revealedIdx, setRevealedIdx] = useState(-1);
    
    return (
        <div className="w-full max-w-6xl mx-auto py-12 pointer-events-auto">
            <div className="flex justify-end mb-12">
                <button onClick={() => setRevealedIdx(lines.length)} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition-colors">Reveal All Lines</button>
            </div>
            <div className="space-y-12">
                {lines.map((line: any, j: number) => {
                    const sideRight = String(line.side) === 'right';
                    const speakerInitial = typeof line.speaker === 'string' && line.speaker.trim().length > 0 ? line.speaker.trim()[0].toUpperCase() : '?';
                    const isRevealed = revealedIdx >= j;

                    return (
                        <div key={j} className={`flex items-end gap-6 cursor-pointer group ${sideRight ? 'flex-row-reverse' : ''}`} onClick={() => setRevealedIdx(Math.max(revealedIdx, j))}>
                            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-[3vh] font-bold text-white shrink-0 shadow-sm border transition-opacity ${isRevealed ? (sideRight ? 'bg-indigo-500 border-indigo-400' : 'bg-slate-700 border-slate-600') : 'bg-slate-800 border-slate-700 opacity-50'}`}>{speakerInitial}</div>
                            <div className={`max-w-[80%] p-10 rounded-[3rem] shadow-md transition-all duration-300 ${isRevealed ? (sideRight ? 'bg-indigo-500/10 text-indigo-100 border border-indigo-500/20 rounded-br-sm' : 'bg-slate-800/80 border border-slate-700 text-slate-200 rounded-bl-sm') : 'bg-slate-900 border border-slate-800 text-transparent group-hover:border-slate-600 border-dashed'}`}>
                                <p className="text-[4vh] font-medium leading-relaxed">{isRevealed ? String(line.text || '') : 'Click to reveal'}</p>
                                {line.translation && isRevealed && <p className={`text-[2.5vh] mt-6 italic opacity-80 font-semibold border-t pt-5 ${sideRight ? 'border-indigo-500/30' : 'border-slate-700'}`}>{String(line.translation)}</p>}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
});

const VocabListBlock = memo(({ block }: { block: any }) => {
    const items = Array.isArray(block.items) ? block.items : [];
    const [revealed, setRevealed] = useState<Record<number, boolean>>({});
    const [page, setPage] = useState(0);
    const perPage = 6;
    const totalPages = Math.ceil(items.length / perPage);
    const currentItems = items.slice(page * perPage, (page + 1) * perPage);

    const playAudio = (text: string, e: React.MouseEvent) => {
        e.stopPropagation();
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    };

    return (
        <div className="py-12 w-full max-w-7xl mx-auto pointer-events-auto">
            <div className="grid grid-cols-2 gap-10">
                {currentItems.map((item: any, j: number) => {
                    const absIdx = page * perPage + j;
                    const isRev = revealed[absIdx];
                    return (
                        <div key={absIdx} onClick={() => setRevealed(p => ({...p, [absIdx]: true}))} className={`p-10 rounded-[3rem] border shadow-xl text-left relative overflow-hidden transition-all duration-300 cursor-pointer min-h-[200px] flex flex-col justify-center ${isRev ? 'bg-slate-900 border-slate-800 hover:-translate-y-1' : 'bg-slate-900/50 border-slate-800/50 hover:bg-slate-800 border-dashed'}`}>
                            {isRev && <div className="absolute -right-8 -top-8 opacity-5 text-indigo-400 rotate-12"><Layers size={200} /></div>}
                            <div className="flex justify-between items-start relative z-10 mb-4">
                                <p className={`text-[5vh] font-bold tracking-tight ${isRev ? 'text-indigo-400' : 'text-slate-500'}`}>{String(item.term || '')}</p>
                                {isRev && <button aria-label="Pronounce" onClick={(e) => playAudio(String(item.term), e)} className="p-4 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-2xl transition-colors"><Volume2 size={32}/></button>}
                            </div>
                            <p className="text-[3vh] text-slate-300 font-medium leading-relaxed relative z-10">{isRev ? String(item.definition || '') : 'Click to reveal definition'}</p>
                        </div>
                    );
                })}
            </div>
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-6 mt-12">
                    <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page === 0} className="p-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-full"><ChevronLeft size={32}/></button>
                    <span className="text-[2.5vh] font-bold text-slate-400">Page {page + 1} of {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages-1, p+1))} disabled={page === totalPages-1} className="p-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-full"><ChevronRight size={32}/></button>
                </div>
            )}
        </div>
    );
});

const DiscussionBlock = memo(({ block }: { block: any }) => (
    <div className="w-full max-w-6xl mx-auto bg-indigo-500/10 rounded-[4rem] p-16 border border-indigo-500/20 shadow-2xl my-12 transition-colors">
        <div className="flex items-center gap-6 mb-16 justify-center">
            <div className="p-6 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-[2rem] shadow-sm motion-safe:animate-bounce shrink-0" style={{ animationDuration: '3s' }} aria-hidden="true"><MessageCircle size={48} strokeWidth={2.5}/></div>
            <h3 className="text-[5vh] font-bold text-indigo-300 tracking-tight">{String(block.title || "Let's Discuss")}</h3>
        </div>
        <div className="space-y-8">
            {(Array.isArray(block.questions) ? block.questions : []).map((q: any, j: number) => (
                <div key={j} className="bg-slate-900/90 p-10 rounded-[2.5rem] shadow-sm border border-slate-800 flex gap-8 items-start hover:-translate-y-1 transition-transform duration-300">
                    <span className="text-[4.5vh] font-black text-indigo-500 leading-none shrink-0">{j + 1}</span>
                    <p className="text-[4vh] font-medium text-slate-200 leading-snug">{String(q || '')}</p>
                </div>
            ))}
        </div>
    </div>
));

const GameBlock = memo(({ block, lessonVocab }: { block: any, lessonVocab: any }) => (
    <div className="w-full max-w-6xl mx-auto flex flex-col items-center py-12">
        <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-6 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 rounded-[2.5rem] mb-6 shadow-sm" aria-hidden="true"><Gamepad2 size={56} strokeWidth={2}/></div>
            <h3 className="text-[6vh] font-bold text-white leading-none tracking-tight">{String(block.title || "Vocabulary Battle")}</h3>
        </div>
        <div className="scale-[1.2] origin-top mt-8 w-full flex justify-center pointer-events-auto">
            <ConnectThreeVocab vocabList={lessonVocab} />
        </div>
    </div>
));

const ScenarioBlock = memo(({ block, liveState }: { block: any, liveState: any }) => {
    const activeNodeId = liveState?.currentNodeId || block.nodes?.[0]?.id;
    const currentNode = Array.isArray(block.nodes) ? block.nodes.find((n:any) => String(n.id) === String(activeNodeId)) || block.nodes[0] : null;
    const bgColors: any = { neutral: 'bg-emerald-950/40 border-emerald-500/30 text-emerald-100', success: 'bg-indigo-950/40 border-indigo-500/30 text-indigo-100', failure: 'bg-rose-950/40 border-rose-500/30 text-rose-100' };
    const style = bgColors[currentNode?.color || 'neutral'];

    return (
        <div className={`w-full max-w-6xl mx-auto rounded-[4rem] p-20 shadow-2xl border text-center transition-colors duration-500 my-12 ${style}`}>
            <span className="text-[2.2vh] font-bold uppercase tracking-widest block mb-10 opacity-70">Interactive Scenario • {String(currentNode?.speaker || 'Character')}</span>
            <h3 className="text-[5.5vh] font-serif italic mb-16 leading-tight">"{String(currentNode?.text || '')}"</h3>
            <div className="inline-block px-10 py-5 bg-black/40 rounded-full border border-white/10 backdrop-blur-md motion-safe:animate-pulse">
                <p className="text-[3vh] font-semibold text-white/90">Look at your device to make a choice!</p>
            </div>
        </div>
    );
});

const CodeBlock = memo(({ block }: { block: any }) => (
    <div className="py-12 w-full max-w-6xl mx-auto">
        <div className="bg-[#0D1117] rounded-[3rem] overflow-hidden shadow-2xl border border-slate-800">
            <div className="bg-white/5 px-8 py-5 flex justify-between items-center border-b border-white/5">
                <div className="flex gap-2.5"><div className="w-4 h-4 rounded-full bg-rose-500"></div><div className="w-4 h-4 rounded-full bg-amber-500"></div><div className="w-4 h-4 rounded-full bg-emerald-500"></div></div>
                <span className="text-[2vh] font-bold text-slate-400 uppercase tracking-widest">{String(block.language || 'Terminal')}</span>
            </div>
            <div className="p-10 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <pre className="text-emerald-400 font-mono text-[3vh] leading-relaxed"><code>{String(block.content || '')}</code></pre>
            </div>
        </div>
    </div>
));

const TimelineBlock = memo(({ block }: { block: any }) => (
    <div className="py-12 w-full max-w-6xl mx-auto">
        {block.title && (<div className="flex items-center gap-6 mb-20 justify-center"><div className="p-6 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-[2rem]"><BookOpen size={48} strokeWidth={2.5}/></div><h3 className="text-[6vh] font-bold text-white tracking-tight">{String(block.title)}</h3></div>)}
        <div className="space-y-16 relative before:absolute before:inset-0 before:mx-auto before:h-full before:w-2 before:bg-slate-800 before:rounded-full">
            {(Array.isArray(block.events) ? block.events : []).map((event: any, evIdx: number) => (
                <div key={evIdx} className="relative flex items-center justify-between odd:flex-row-reverse group">
                    <div className="flex items-center justify-center w-20 h-20 rounded-full border-[8px] border-slate-950 bg-indigo-600 text-white shadow-xl shrink-0 order-1 group-odd:-translate-x-1/2 group-even:translate-x-1/2 z-10 transition-transform group-hover:scale-110"><div className="w-4 h-4 bg-white rounded-full" /></div>
                    <div className="w-[calc(50%-4rem)] p-10 rounded-[3rem] bg-slate-900 border border-slate-800 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 group-hover:border-indigo-500/50">
                        <span className="font-bold text-indigo-400 text-[2.2vh] tracking-widest uppercase mb-4 block">{String(event.date || '')}</span>
                        <h4 className="font-bold text-white text-[4vh] leading-tight mb-4 tracking-tight">{String(event.title || '')}</h4>
                        <p className="text-slate-400 text-[2.8vh] font-medium leading-relaxed">{String(event.description || '')}</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
));

const QuizBlock = memo(({ block, liveState, triggerQuiz }: { block: any, liveState: any, triggerQuiz: any }) => {
    const answerCount = Object.keys(liveState?.answers || {}).length;
    const totalCount = Object.keys(liveState?.students || {}).length || 1;
    const options = Array.isArray(block.content?.options) ? block.content.options : [];
    
    const answerCounts: Record<string, number> = {};
    Object.values(liveState?.answers || {}).forEach((ans: any) => { answerCounts[ans.answerId] = (answerCounts[ans.answerId] || 0) + 1; });

    return (
        <div className="bg-slate-900 text-white border border-slate-800 rounded-[4rem] p-16 shadow-2xl text-center animate-in slide-in-from-bottom-12 duration-500 mx-auto max-w-6xl my-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 text-slate-800 opacity-30 rotate-12 pointer-events-none"><HelpCircle size={300} strokeWidth={1.5} /></div>
            <div className="relative z-10">
                <span className="text-[2.5vh] font-bold text-indigo-400 uppercase tracking-widest block mb-8">Class Question</span>
                <h2 className="text-[5.5vh] md:text-[6.5vh] font-bold mb-12 leading-tight tracking-tight">{String(block.content?.question || block.question || '')}</h2>
                
                {liveState?.quizState === 'waiting' && (
                    <button onClick={() => triggerQuiz('active')} className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white px-12 py-6 rounded-full font-bold text-[3vh] uppercase tracking-wider shadow-[0_0_40px_rgba(244,63,94,0.4)] transition-transform hover:-translate-y-1 active:scale-95 flex items-center gap-4 mx-auto pointer-events-auto"><Zap size={36} fill="currentColor" /> Start Question</button>
                )}

                {liveState?.quizState === 'active' && (
                    <div className="space-y-12 animate-in fade-in duration-500">
                        <div className="grid grid-cols-2 gap-6 text-left">
                            {options.map((opt:any, i:number) => (
                                <div key={opt.id} className="p-8 bg-slate-800/50 rounded-3xl border border-slate-700/50 flex items-center gap-6">
                                    <span className="w-12 h-12 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center text-xl shrink-0">{String.fromCharCode(65+i)}</span>
                                    <span className="text-[3vh] font-semibold">{opt.text}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col items-center justify-center gap-6 text-[5vh] font-bold text-indigo-400">
                            <div className="flex items-center gap-6 bg-slate-800/80 px-12 py-6 rounded-[2.5rem] shadow-inner border border-slate-700/50">
                                <Users size={56} className="motion-safe:animate-pulse" /> <span>{answerCount} of {totalCount} Answered</span>
                            </div>
                        </div>
                        <button onClick={() => triggerQuiz('revealed')} className="bg-indigo-600 hover:bg-indigo-500 text-white px-12 py-6 rounded-full font-bold text-[3vh] uppercase tracking-wider transition-all hover:-translate-y-1 active:scale-95 shadow-lg shadow-indigo-500/20 mx-auto pointer-events-auto">Reveal Answer</button>
                    </div>
                )}

                {liveState?.quizState === 'revealed' && (
                    <div className="animate-in zoom-in duration-500 flex flex-col items-center">
                        <div className="inline-flex items-center gap-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-10 py-5 rounded-[2.5rem] text-[4vh] font-bold mb-12 shadow-[0_0_30px_rgba(16,185,129,0.1)]"><CheckCircle2 size={48} strokeWidth={2.5}/> Correct Answer</div>
                        
                        <div className="grid grid-cols-2 gap-6 w-full text-left mb-12">
                            {options.map((opt:any, i:number) => {
                                const isCorrect = String(opt.id) === String(block.content?.correctId);
                                const count = answerCounts[opt.id] || 0;
                                const pct = Math.round((count / Math.max(1, answerCount)) * 100);
                                return (
                                    <div key={opt.id} className={`p-8 rounded-3xl border flex flex-col gap-4 relative overflow-hidden ${isCorrect ? 'bg-emerald-500/20 border-emerald-500/50 text-white' : 'bg-slate-800/50 border-slate-700/50 text-slate-400'}`}>
                                        <div className="flex items-center gap-6 relative z-10">
                                            <span className={`w-12 h-12 rounded-full font-bold flex items-center justify-center text-xl shrink-0 ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-700'}`}>{String.fromCharCode(65+i)}</span>
                                            <span className="text-[3vh] font-semibold flex-1">{opt.text}</span>
                                            <span className="text-[3.5vh] font-black opacity-50">{pct}%</span>
                                        </div>
                                        <div className="absolute left-0 bottom-0 top-0 bg-white/5" style={{ width: `${pct}%` }} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

const FillBlankBlock = memo(({ block, liveState }: { block: any, liveState: any }) => {
    const rawText = String(block.text || "Missing text [here].");
    const { textParts, correctAnswers } = useMemo(() => {
        const parts = rawText.split(/\[.*?\]/g);
        const answers: string[] = [];
        const regex = /\[(.*?)\]/g;
        let match;
        while ((match = regex.exec(rawText)) !== null) answers.push(String(match[1]));
        return { textParts: parts, correctAnswers: answers };
    }, [rawText]);

    const distractors = useMemo(() => {
        let rawOptions = [];
        try { rawOptions = JSON.parse(JSON.stringify(block.distractors || [])); } catch (e) {}
        if (!Array.isArray(rawOptions)) rawOptions = typeof rawOptions === 'string' ? [rawOptions] : [];
        return rawOptions.map((opt: any) => String(opt)).filter(Boolean);
    }, [block.distractors]);

    const shuffledWords = useMemo(() => [...correctAnswers, ...distractors].sort(() => 0.5 - Math.random()), [correctAnswers, distractors]);
    const initialWordBank = useMemo(() => shuffledWords.map((w, i) => ({ id: `word_${i}_${w}`, word: w })), [shuffledWords]);

    const [wordBank, setWordBank] = useState<{ id: string; word: string }[]>(initialWordBank);
    const [filledBlanks, setFilledBlanks] = useState<({ id: string; word: string } | null)[]>(Array(correctAnswers.length).fill(null));
    const [isChecked, setIsChecked] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => { setWordBank(initialWordBank); setFilledBlanks(Array(correctAnswers.length).fill(null)); setIsChecked(false); setIsExpanded(false); }, [initialWordBank, correctAnswers.length]);

    const handleBankClick = (item: { id: string; word: string }) => {
        if (isChecked) return;
        const firstEmptyIdx = filledBlanks.indexOf(null); 
        if (firstEmptyIdx !== -1) {
            const newFilled = [...filledBlanks]; newFilled[firstEmptyIdx] = item;
            setFilledBlanks(newFilled); setWordBank(wordBank.filter(w => w.id !== item.id));
        }
    };

    const handleBlankClick = (item: { id: string; word: string } | null, idx: number) => {
        if (isChecked || !item) return;
        const newFilled = [...filledBlanks]; newFilled[idx] = null; 
        setFilledBlanks(newFilled); setWordBank([...wordBank, item]);
    };

    const isComplete = filledBlanks.length > 0 && filledBlanks.indexOf(null) === -1;
    const isEntirelyCorrect = isChecked && filledBlanks.every((item, i) => item?.word === correctAnswers[i]);

    return (
        <div className="w-full max-w-7xl mx-auto bg-slate-900 rounded-[4rem] border border-slate-800 shadow-2xl my-12 flex flex-col relative overflow-visible pointer-events-auto transition-colors">
            <div className="p-12 md:p-16 pb-8">
                <h3 className="text-[4.5vh] font-bold text-white flex items-center justify-center gap-5 tracking-tight">
                    <span className="bg-amber-500/10 text-amber-500 p-5 rounded-[2rem] border border-amber-500/20" aria-hidden="true"><Puzzle size={48} strokeWidth={2.5}/></span>
                    {String(block.question || "Fill in the blanks")}
                </h3>
            </div>

            {!isChecked && (
                <div className="sticky top-4 z-50 -mx-4 px-4 mb-16">
                    <div className={`bg-slate-900/95 backdrop-blur-3xl rounded-[3rem] p-8 border border-slate-700/50 shadow-2xl flex flex-col items-center gap-6 transition-all duration-500 relative overflow-hidden ${isExpanded ? 'max-h-[60vh]' : 'max-h-[25vh] min-h-[25vh]'}`}>
                        <span className="text-[2vh] font-bold text-slate-500 uppercase tracking-widest shrink-0 text-center">Word Bank Options</span>
                        <div className={`flex flex-wrap gap-5 justify-center items-start w-full transition-all duration-500 ${isExpanded ? 'overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-12' : 'overflow-hidden pb-4'}`}>
                            {wordBank.length === 0 ? (
                                <span className="text-[3vh] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-3"><CheckCircle2 size={32} className="text-emerald-500" strokeWidth={2.5}/> All placed</span>
                            ) : (
                                wordBank.map((item) => (
                                    <button aria-label={`Select word ${item.word}`} key={item.id} onClick={() => handleBankClick(item)} disabled={isChecked} className="px-8 py-4 rounded-2xl border text-[3vh] font-semibold transition-all duration-300 bg-slate-800 border-slate-700 text-slate-300 shadow-sm hover:border-indigo-500/50 hover:text-indigo-300 hover:-translate-y-1 active:scale-95">
                                        {item.word}
                                    </button>
                                ))
                            )}
                        </div>
                        {wordBank.length > 6 && (
                            <div className={`absolute bottom-0 left-0 right-0 flex justify-center pb-4 pt-16 pointer-events-none transition-all ${!isExpanded ? 'bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent' : ''}`}>
                                <button onClick={() => setIsExpanded(!isExpanded)} className="pointer-events-auto bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-8 py-3 rounded-full font-bold text-[2vh] uppercase tracking-wider flex items-center gap-3 shadow-sm transition-all active:scale-95 border border-indigo-500/30">
                                    {isExpanded ? <><ChevronUp size={24} /> Collapse</> : <><ChevronDown size={24} /> View All {wordBank.length} Options</>}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="px-12 md:px-16 pb-20 flex-1">
                <div className="text-[5vh] font-medium leading-[2.2] text-slate-300 flex flex-wrap items-center gap-y-10 justify-center text-center tracking-tight">
                    {textParts.map((part: string, idx: number) => {
                        const isLast = idx === textParts.length - 1;
                        const filledItem = filledBlanks[idx];
                        const filledWord = filledItem?.word;
                        const isRight = filledWord === correctAnswers[idx];

                        let style = "border-b-4 border-slate-700 bg-slate-950 text-slate-500 rounded-t-2xl";
                        if (filledItem && !isChecked) style = "border-2 border-indigo-500/50 bg-indigo-500/10 text-indigo-300 shadow-lg scale-105 -translate-y-1 cursor-pointer hover:bg-rose-500/10 hover:border-rose-500/50 hover:text-rose-400 rounded-2xl";
                        if (isChecked && isRight) style = "border-2 border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-lg rounded-2xl";
                        if (isChecked && !isRight) style = "border-2 border-rose-500/50 bg-rose-500/10 text-rose-400 shadow-lg cursor-pointer rounded-2xl";

                        return (
                            <React.Fragment key={`part_${idx}`}>
                                <span className="mx-2">{String(part)}</span>
                                {!isLast && (
                                    <button aria-label="Blank slot" onClick={() => handleBlankClick(filledItem, idx)} disabled={isChecked} className={`min-w-[160px] h-20 px-8 mx-4 flex items-center justify-center gap-3 text-[4vh] font-bold transition-all duration-300 ${style}`}>
                                        {filledWord || " "}
                                        {isChecked && isRight && <Check size={28} strokeWidth={3} className="text-emerald-500" />}
                                        {isChecked && !isRight && filledItem && <X size={28} strokeWidth={3} className="text-rose-500" />}
                                    </button>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
                
                {isComplete && !isChecked && (
                    <div className="mt-16 flex justify-center animate-in slide-in-from-bottom-4">
                        <button onClick={() => setIsChecked(true)} className="px-12 py-6 bg-emerald-600 text-white rounded-[2rem] font-bold text-[3vh] uppercase tracking-wider shadow-xl shadow-emerald-500/20 hover:bg-emerald-500 transition-all hover:-translate-y-1 active:scale-95">Check Answers</button>
                    </div>
                )}
                
                {isChecked && (
                    <div className="mt-16 flex justify-center animate-in zoom-in-95">
                        {isEntirelyCorrect ? (
                            <div className="px-12 py-6 bg-emerald-500/10 text-emerald-400 border-2 border-emerald-500/30 rounded-[2rem] font-bold text-[3vh] uppercase tracking-wider flex items-center gap-4">
                                <CheckCircle2 size={40} strokeWidth={3}/> Perfectly Placed!
                            </div>
                        ) : (
                            <button onClick={() => { setFilledBlanks(Array(correctAnswers.length).fill(null)); setWordBank(initialWordBank); setIsChecked(false); }} className="px-12 py-6 bg-rose-500/10 text-rose-400 border-2 border-rose-500/30 rounded-[2rem] font-bold text-[3vh] uppercase tracking-wider shadow-sm hover:bg-rose-500/20 active:scale-95 transition-all">Try Again</button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
});

const TapSortBlock = memo(({ block, liveState }: { block: any, liveState?: any }) => {
    const normalizedItems = useMemo(() => {
        let rawItems = [];
        try { rawItems = JSON.parse(JSON.stringify(block.items || [])); } catch (e) {}
        if (!Array.isArray(rawItems)) rawItems = [];
        return rawItems.map((item: any, idx: number) => {
            if (typeof item === 'string' || typeof item === 'number') return { id: `item_${idx}`, label: String(item), emoji: '🔹' };
            return { id: String(item?.id || `item_${idx}`), label: String(item?.label || item?.text || ''), emoji: String(item?.emoji || '🔹') };
        });
    }, [block.items]);

    const parsedCategories = useMemo(() => {
        let cats = [];
        try { cats = JSON.parse(JSON.stringify(block.categories || [])); } catch (e) {}
        if (!Array.isArray(cats)) cats = [];
        return cats.map((c: any) => String(c));
    }, [block.categories]);

    const [items, setItems] = useState<{ id: string; label: string; emoji: string }[]>(normalizedItems);
    const [placed, setPlaced] = useState<Record<string, { id: string; label: string; emoji: string }[]>>({});
    const [selectedItem, setSelectedItem] = useState<{ id: string; label: string; emoji: string } | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        setItems(normalizedItems);
        const init: Record<string, { id: string; label: string; emoji: string }[]> = {};
        parsedCategories.forEach((c: string) => { init[c] = []; });
        setPlaced(init);
        setSelectedItem(null);
        setIsExpanded(false);
    }, [normalizedItems, parsedCategories]);

    const handleBucketClick = (category: string) => {
        if (selectedItem) {
            setPlaced(prev => ({...prev, [category]: [...(prev[category] || []), selectedItem]}));
            setItems(items.filter((i) => i.id !== selectedItem.id));
            setSelectedItem(null);
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto bg-slate-900 rounded-[4rem] border border-slate-800 shadow-2xl my-12 flex flex-col relative overflow-visible pointer-events-auto transition-colors">
            <div className="p-12 md:p-16 pb-8">
                <h3 className="text-[4.5vh] font-bold text-white flex items-center justify-center gap-5 tracking-tight">
                    <span className="bg-amber-500/10 text-amber-500 p-5 rounded-[2rem] border border-amber-500/20"><MousePointerClick size={48} strokeWidth={2.5}/></span>
                    {String(block.title || 'Sort the Items!')}
                </h3>
            </div>

            <div className="sticky top-4 z-50 -mx-4 px-4 mb-16">
                <div className={`bg-slate-900/95 backdrop-blur-3xl rounded-[3rem] p-8 border border-slate-700/50 shadow-2xl flex flex-col items-center gap-6 transition-all duration-500 relative overflow-hidden ${isExpanded ? 'max-h-[60vh]' : 'max-h-[25vh] min-h-[25vh]'}`}>
                    <span className="text-[2vh] font-bold text-amber-500/80 uppercase tracking-widest text-center shrink-0">Items to Sort</span>
                    <div className={`flex flex-wrap justify-center gap-5 w-full transition-all duration-500 ${isExpanded ? 'overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-12' : 'overflow-hidden pb-4'}`}>
                        {items.length === 0 ? (
                            <p className="text-amber-500/80 font-bold uppercase tracking-widest my-auto flex items-center gap-3 text-[3vh]"><CheckCircle2 size={32} strokeWidth={2.5}/> All sorted!</p>
                        ) : (
                            items.map((item) => (
                                <button key={item.id} onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)} className={`px-8 py-4 rounded-2xl font-semibold text-[3vh] transition-all duration-300 shadow-sm border ${selectedItem?.id === item.id ? 'bg-indigo-600 text-white scale-110 -translate-y-1 border-indigo-500 shadow-indigo-500/20' : 'bg-slate-800 text-slate-300 hover:scale-105 active:scale-95 border-slate-700 hover:border-amber-500/50'}`}>
                                    {item.emoji} {item.label}
                                </button>
                            ))
                        )}
                    </div>
                    {items.length > 6 && (
                        <div className={`absolute bottom-0 left-0 right-0 flex justify-center pb-4 pt-16 pointer-events-none transition-all ${!isExpanded ? 'bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent' : ''}`}>
                            <button onClick={() => setIsExpanded(!isExpanded)} className="pointer-events-auto bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 px-8 py-3 rounded-full font-bold text-[2vh] uppercase tracking-wider flex items-center gap-3 shadow-sm transition-all active:scale-95 border border-amber-500/30">
                                {isExpanded ? <><ChevronUp size={24} /> Collapse</> : <><ChevronDown size={24} /> View All {items.length} Items</>}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="px-12 md:px-16 pb-24 grid grid-cols-1 md:grid-cols-2 gap-10 flex-1">
                {parsedCategories.map((cat: string) => {
                    const isPlacedEmpty = !placed[cat] || placed[cat].length === 0;
                    return (
                        <div key={cat} onClick={() => handleBucketClick(cat)} className={`p-10 rounded-[4rem] border-4 transition-colors duration-300 flex flex-col items-center gap-8 min-h-[30vh] ${selectedItem ? 'border-indigo-500/50 bg-indigo-500/10 animate-pulse cursor-pointer shadow-xl' : 'border-slate-800 bg-slate-950 cursor-default'}`}>
                            <h4 className="font-bold text-amber-500 text-[4.5vh] text-center leading-tight tracking-tight">{cat}</h4>
                            <div className="flex flex-wrap justify-center gap-4 w-full">
                                {isPlacedEmpty ? (
                                    <span className="text-slate-600 text-[3vh] font-bold uppercase tracking-wider mt-8">Drop Zone</span>
                                ) : (
                                    (placed[cat] || []).map((item) => (
                                        <div key={item.id} className="px-6 py-3 bg-slate-800 rounded-2xl text-[3vh] font-semibold shadow-sm border border-slate-700 flex items-center gap-3 text-slate-200">
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
});

const LiveRoleplayBlock = memo(({ block, onLaunch }: { block: any, onLaunch: (prompt: string) => void }) => (
    <div className="bg-slate-950 p-12 md:p-16 rounded-[4rem] shadow-2xl my-12 text-white relative overflow-hidden group w-full max-w-6xl mx-auto text-center border border-slate-800 pointer-events-auto">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-cyan-500/20 transition-colors duration-700" />
        <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-indigo-500/20 transition-colors duration-700" />
        
        <div className="relative z-10 flex flex-col items-center">
            <div className="w-28 h-28 bg-slate-900 border border-cyan-500/30 rounded-[2.5rem] flex items-center justify-center text-cyan-400 mb-10 shadow-[0_0_30px_rgba(6,182,212,0.15)] motion-safe:animate-pulse">
                <Mic size={56} strokeWidth={2}/>
            </div>
            
            <h3 className="text-[6vh] font-bold mb-8 leading-tight tracking-tight">
                {String(block.title || "Live Simulation")}
            </h3>
            
            <div className="flex gap-6 items-center justify-center mb-12">
                <div className="px-8 py-4 bg-slate-800/80 border border-slate-700/50 rounded-2xl text-[2.5vh] font-bold uppercase tracking-wider text-slate-400">
                    AI: <span className="text-cyan-400">{block.metadata?.aiPersona || 'Unknown'}</span>
                </div>
                <div className="px-8 py-4 bg-slate-800/80 border border-slate-700/50 rounded-2xl text-[2.5vh] font-bold uppercase tracking-wider text-slate-400">
                    You: <span className="text-indigo-400">{block.metadata?.studentRole || 'Unknown'}</span>
                </div>
            </div>

            <p className="text-slate-300 font-medium text-[3.5vh] leading-relaxed max-w-4xl mb-16">
                Your Objective: <strong className="text-white">{block.metadata?.objective || 'Complete the scenario successfully.'}</strong>
            </p>

            <button 
                onClick={() => onLaunch(block.prompt)}
                className="px-12 py-6 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-[2.5rem] font-bold text-[3vh] uppercase tracking-wider shadow-xl hover:shadow-cyan-500/25 active:scale-95 hover:-translate-y-1 transition-all flex items-center justify-center gap-4"
            >
                <Mic size={36} strokeWidth={2.5}/> Start Call on Smartboard
            </button>
        </div>
    </div>
));

const GrammarBlock = memo(({ block }: { block: any }) => {
    const [revealed, setRevealed] = useState<Record<number, boolean>>({});

    const toggleReveal = (idx: number) => {
        setRevealed(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    return (
        <div className="w-full max-w-7xl mx-auto my-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pointer-events-auto">
            <div className="bg-slate-900 rounded-[4rem] p-12 md:p-20 shadow-2xl border border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500" />
                <div className="absolute -top-32 -right-32 w-[30rem] h-[30rem] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

                <header className="mb-16 relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
                    <div className="p-6 bg-indigo-500/10 text-indigo-400 rounded-[2rem] shrink-0 border border-indigo-500/20">
                        <Presentation size={56} strokeWidth={2}/>
                    </div>
                    <div>
                        <h2 className="text-[5.5vh] font-bold text-white tracking-tight mb-4 leading-none">
                            {block.title || 'Grammar Focus'}
                        </h2>
                        <p className="text-[3vh] text-slate-300 font-medium leading-relaxed">
                            {block.rule}
                        </p>
                    </div>
                </header>

                {block.formula && (
                    <div className="bg-slate-950/80 border border-slate-800 rounded-[3rem] p-10 mb-16 relative z-10 shadow-inner">
                        <div className="text-[2.2vh] font-bold uppercase tracking-wider text-slate-500 mb-6 flex items-center justify-center md:justify-start gap-3">
                            <AlertCircle size={24} className="text-amber-500" /> Structure Formula
                        </div>
                        <p className="text-[5vh] font-mono font-bold text-cyan-400 tracking-tight text-center md:text-left leading-snug">
                            {block.formula}
                        </p>
                    </div>
                )}

                <div className="space-y-6 relative z-10">
                    <div className="text-[2.2vh] font-bold uppercase tracking-wider text-slate-500 mb-8 flex items-center justify-center md:justify-start gap-3">
                        <AlertCircle size={24} /> Drill Examples
                    </div>
                    
                    {block.examples?.map((ex: any, idx: number) => {
                        const parts = ex.en.split(new RegExp(`(${ex.target})`, 'gi'));
                        const isRevealed = revealed[idx];
                        
                        return (
                            <div key={idx} className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 p-8 bg-slate-800/40 hover:bg-slate-800/60 rounded-[2.5rem] border border-slate-700/50 transition-colors group">
                                <p className="text-[4vh] font-medium text-white flex-1 leading-snug cursor-pointer" onClick={() => toggleReveal(idx)}>
                                    {parts.map((part: string, i: number) => 
                                        part.toLowerCase() === (ex.target || '').toLowerCase() ? (
                                            <span 
                                                key={i} 
                                                className={`inline-block mx-2 font-bold transition-all duration-300 px-4 py-1 rounded-2xl ${isRevealed ? 'text-amber-400 bg-amber-500/10 border-2 border-amber-500/20' : 'text-transparent bg-slate-700/80 hover:bg-slate-700 border-2 border-slate-600/50 min-w-[120px]'}`}
                                            >
                                                {isRevealed ? part : ''}
                                            </span>
                                        ) : (
                                            <span key={i}>{part}</span>
                                        )
                                    )}
                                </p>
                                {ex.note && (
                                    <p className="text-[2.5vh] font-medium text-slate-400 xl:max-w-lg text-left xl:text-right border-l-4 xl:border-l-0 border-slate-700 pl-6 xl:pl-0 pt-4 xl:pt-0">
                                        {ex.note}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
});
