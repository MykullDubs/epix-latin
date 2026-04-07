// src/components/instructor/InstructorHUD.tsx
import React, { useState, useEffect } from 'react';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';
import { 
    Wifi, Users, ChevronUp, ChevronDown, 
    ChevronLeft, ChevronRight, X, LayoutTemplate, 
    Activity, ShieldAlert, CheckCircle2, Radio
} from 'lucide-react';

export default function InstructorHUD({ lesson, classId, activeClass, onExit }: any) {
    const [sessionData, setSessionData] = useState<any>(null);
    const [isTransmitting, setIsTransmitting] = useState(false);

    // Listen to the Live Session state in real-time
    useEffect(() => {
        if (!classId) return;
        const sessionRef = doc(db, 'artifacts', appId, 'live_sessions', classId);
        const unsub = onSnapshot(sessionRef, (doc) => {
            if (doc.exists()) {
                setSessionData(doc.data());
            }
        });
        return () => unsub();
    }, [classId]);

    const connectedCount = sessionData?.joined ? Object.keys(sessionData.joined).length : 0;
    const blocks = lesson?.blocks || [];
    const currentIndex = sessionData?.currentBlockIndex || 0;
    const currentBlock = blocks[currentIndex];

    // ============================================================================
    //  REMOTE CONTROL COMMANDS (WRITES TO FIREBASE)
    // ============================================================================
    
    // 1. Change Lesson Blocks (Slides)
    const handleNavigate = async (direction: 'prev' | 'next') => {
        let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
        if (newIndex < 0) newIndex = 0;
        if (newIndex >= blocks.length) newIndex = blocks.length - 1;
        
        if (newIndex !== currentIndex) {
            setIsTransmitting(true);
            if ("vibrate" in navigator) navigator.vibrate(20);
            try {
                await updateDoc(doc(db, 'artifacts', appId, 'live_sessions', classId), {
                    currentBlockIndex: newIndex,
                    quizState: 'waiting', // Reset any active quizzes on the new slide
                    answers: {} 
                });
            } finally {
                setTimeout(() => setIsTransmitting(false), 300);
            }
        }
    };

    // 2. Remote Scroll the Projector/Student Screens
    const handleRemoteScroll = async (direction: 'up' | 'down') => {
        setIsTransmitting(true);
        if ("vibrate" in navigator) navigator.vibrate(10);
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'live_sessions', classId), {
                scrollCommand: {
                    direction,
                    timestamp: Date.now() // The timestamp ensures the projector detects duplicate taps!
                }
            });
        } finally {
            setTimeout(() => setIsTransmitting(false), 200);
        }
    };

    // 3. Terminate Uplink
    const handleTerminate = async () => {
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'live_sessions', classId), {
                isActive: false,
                terminatedAt: Date.now()
            });
        } catch(e) {}
        onExit();
    };

    if (!lesson) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 p-6 font-sans">
                <ShieldAlert size={64} className="mb-6 opacity-50 text-rose-500" />
                <h2 className="text-2xl font-black uppercase tracking-widest text-white mb-3">No Payload Detected</h2>
                <p className="text-center text-sm font-bold max-w-md text-slate-500 leading-relaxed">
                    The HUD requires a valid Lesson payload to initialize. Please select a lesson from the Magister Command Center.
                </p>
                <button onClick={onExit} className="mt-10 px-10 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black uppercase tracking-widest transition-colors active:scale-95">Abort Link</button>
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col bg-slate-950 font-sans text-slate-200 select-none overflow-hidden pb-safe">
            
            {/* --- OS UPLINK HEADER --- */}
            <div className="bg-slate-900 border-b border-slate-800 p-4 md:p-6 flex justify-between items-center shrink-0 shadow-lg relative overflow-hidden pt-safe-4">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-400 opacity-50" />
                
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-[1.25rem] flex items-center justify-center border border-emerald-500/20 relative">
                        {isTransmitting ? (
                            <Radio className="animate-pulse text-emerald-400" size={24} />
                        ) : (
                            <Wifi size={24} />
                        )}
                        {/* Radar Ping Effect */}
                        <div className="absolute inset-0 rounded-[1.25rem] border border-emerald-400 opacity-0 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
                    </div>
                    <div>
                        <h1 className="text-sm md:text-base font-black text-white uppercase tracking-widest leading-none mb-1">HUD Uplink</h1>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" /> Active Sync
                        </div>
                    </div>
                </div>

                <button onClick={handleTerminate} className="w-12 h-12 bg-slate-800/50 text-slate-400 hover:bg-rose-500/20 hover:text-rose-500 hover:border-rose-500/30 rounded-2xl flex items-center justify-center transition-colors border border-slate-700/50 active:scale-95 shadow-sm">
                    <X size={24} strokeWidth={2.5} />
                </button>
            </div>

            {/* --- TELEMETRY DASHBOARD --- */}
            <div className="grid grid-cols-2 gap-4 p-4 md:p-6 shrink-0 relative z-10">
                <div className="bg-gradient-to-b from-slate-900 to-slate-900/50 rounded-3xl p-5 border border-white/5 flex flex-col items-center justify-center text-center shadow-lg">
                    <div className="flex items-center gap-2 mb-3 text-indigo-400">
                        <Users size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Roster</span>
                    </div>
                    <span className="text-4xl font-black text-white leading-none">{connectedCount}</span>
                </div>
                
                <div className="bg-gradient-to-b from-slate-900 to-slate-900/50 rounded-3xl p-5 border border-white/5 flex flex-col items-center justify-center text-center shadow-lg">
                    <div className="flex items-center gap-2 mb-3 text-fuchsia-400">
                        <LayoutTemplate size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Slide</span>
                    </div>
                    <div className="text-4xl font-black text-white leading-none flex items-baseline gap-1">
                        {currentIndex + 1} <span className="text-xl text-slate-600 font-bold">/ {blocks.length}</span>
                    </div>
                </div>
            </div>

            <div className="px-6 text-center shrink-0 mb-4 md:mb-8 relative z-10">
                <h2 className="text-xl md:text-2xl font-black text-white line-clamp-1 tracking-tight">{lesson.title}</h2>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2 flex items-center justify-center gap-2">
                    <Activity size={14} className="text-indigo-500"/> Block: {currentBlock?.type || 'Unknown'}
                </p>
            </div>

            {/* --- THE COMMAND D-PAD --- */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[340px] relative z-10">
                <div className="relative w-72 h-72 md:w-[360px] md:h-[360px] bg-slate-900 rounded-full border-8 border-slate-950 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_0_20px_rgba(0,0,0,0.5)] flex items-center justify-center">
                    
                    {/* Inner Crosshair Lines */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                        <div className="w-full h-1 bg-white" />
                        <div className="absolute h-full w-1 bg-white" />
                    </div>

                    {/* Up Scroll */}
                    <button 
                        onClick={() => handleRemoteScroll('up')}
                        className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-20 md:w-36 md:h-24 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 rounded-t-[4rem] border-t-2 border-slate-700 active:border-cyan-400 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95 shadow-md group"
                    >
                        <ChevronUp size={48} className="group-active:-translate-y-2 transition-transform" />
                    </button>

                    {/* Down Scroll */}
                    <button 
                        onClick={() => handleRemoteScroll('down')}
                        className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-20 md:w-36 md:h-24 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 rounded-b-[4rem] border-b-2 border-slate-700 active:border-cyan-400 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95 shadow-md group"
                    >
                        <ChevronDown size={48} className="group-active:translate-y-2 transition-transform" />
                    </button>

                    {/* Prev Block */}
                    <button 
                        onClick={() => handleNavigate('prev')}
                        disabled={currentIndex === 0}
                        className="absolute top-1/2 left-2 -translate-y-1/2 w-20 h-28 md:w-24 md:h-36 bg-slate-800 hover:bg-slate-700 disabled:opacity-20 disabled:hover:bg-slate-800 active:bg-fuchsia-600 rounded-l-[4rem] border-l-2 border-slate-700 active:border-fuchsia-400 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95 shadow-md group"
                    >
                        <ChevronLeft size={40} className="group-active:-translate-x-2 transition-transform" />
                    </button>

                    {/* Next Block */}
                    <button 
                        onClick={() => handleNavigate('next')}
                        disabled={currentIndex === blocks.length - 1}
                        className="absolute top-1/2 right-2 -translate-y-1/2 w-20 h-28 md:w-24 md:h-36 bg-slate-800 hover:bg-slate-700 disabled:opacity-20 disabled:hover:bg-slate-800 active:bg-fuchsia-600 rounded-r-[4rem] border-r-2 border-slate-700 active:border-fuchsia-400 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95 shadow-md group"
                    >
                        <ChevronRight size={40} className="group-active:translate-x-2 transition-transform" />
                    </button>

                    {/* Center Core */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-slate-950 rounded-full border-[6px] border-slate-800 flex items-center justify-center shadow-[inset_0_0_30px_rgba(0,0,0,0.8)] z-10">
                        <div className={`w-6 h-6 rounded-full ${isTransmitting ? 'bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,1)] scale-110' : 'bg-slate-800 shadow-inner scale-100'} transition-all duration-300`} />
                    </div>

                </div>
            </div>

            {/* --- CONTEXTUAL FOOTER --- */}
            <div className="h-32 md:h-40 bg-slate-900/80 backdrop-blur-md border-t border-white/5 p-6 overflow-y-auto custom-scrollbar shrink-0 relative z-10">
                {currentBlock?.type === 'quiz' || currentBlock?.type === 'interactive' ? (
                    <div className="flex flex-col h-full items-center justify-center text-center">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2 bg-indigo-500/10 px-4 py-1.5 rounded-full border border-indigo-500/20">
                            <Activity size={14} /> Live Telemetry Linked
                        </span>
                        <div className="text-sm font-bold text-slate-400 mt-2">
                            Students are interacting with the smartboard.
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-60">
                        <CheckCircle2 size={28} className="mb-2 text-slate-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Standard Content Block</span>
                    </div>
                )}
            </div>

        </div>
    );
}
