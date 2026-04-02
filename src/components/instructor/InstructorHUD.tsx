// src/components/instructor/InstructorHUD.tsx
import React, { useState, useEffect } from 'react';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';
import { 
    Wifi, Users, ChevronUp, ChevronDown, 
    ChevronLeft, ChevronRight, X, LayoutTemplate, 
    Activity, ShieldAlert, CheckCircle2
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
            <div className="h-full w-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 p-6">
                <ShieldAlert size={64} className="mb-4 opacity-50 text-rose-500" />
                <h2 className="text-xl font-black uppercase tracking-widest text-white mb-2">No Payload Detected</h2>
                <p className="text-center text-sm font-bold max-w-md">
                    The HUD requires a valid Lesson payload to initialize. Make sure you select a lesson from the Launch Modal.
                </p>
                <button onClick={onExit} className="mt-8 px-8 py-3 bg-slate-800 text-white rounded-full font-black uppercase tracking-widest">Abort</button>
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col bg-slate-950 font-sans text-slate-200 select-none">
            
            {/* --- OS UPLINK HEADER --- */}
            <div className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center shrink-0 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-50" />
                
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/30">
                        {isTransmitting ? <Activity className="animate-pulse text-emerald-400" size={20} /> : <Wifi size={20} />}
                    </div>
                    <div>
                        <h1 className="text-sm font-black text-white uppercase tracking-widest leading-none mb-1">Magister OS Uplink</h1>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Connection Stable
                        </div>
                    </div>
                </div>

                <button onClick={handleTerminate} className="w-10 h-10 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-full flex items-center justify-center transition-colors border border-rose-500/20 active:scale-90">
                    <X size={20} strokeWidth={3} />
                </button>
            </div>

            {/* --- TELEMETRY DASHBOARD --- */}
            <div className="grid grid-cols-2 gap-4 p-4 shrink-0">
                <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 flex flex-col items-center justify-center text-center">
                    <Users size={24} className="text-indigo-400 mb-2" />
                    <span className="text-3xl font-black text-white">{connectedCount}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-1">Scholars Connected</span>
                </div>
                <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 flex flex-col items-center justify-center text-center">
                    <LayoutTemplate size={24} className="text-fuchsia-400 mb-2" />
                    <span className="text-3xl font-black text-white">{currentIndex + 1} <span className="text-lg text-slate-600">/ {blocks.length}</span></span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-1">Active Module</span>
                </div>
            </div>

            <div className="px-6 text-center shrink-0 mb-4">
                <h2 className="text-lg font-black text-white line-clamp-1">{lesson.title}</h2>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                    Current Block: {currentBlock?.type || 'Unknown'}
                </p>
            </div>

            {/* --- THE COMMAND D-PAD --- */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[300px]">
                <div className="relative w-64 h-64 md:w-80 md:h-80">
                    
                    {/* Up Scroll */}
                    <button 
                        onClick={() => handleRemoteScroll('up')}
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-20 md:w-32 md:h-24 bg-slate-800 hover:bg-slate-700 active:bg-indigo-600 rounded-t-3xl border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95 shadow-lg"
                    >
                        <ChevronUp size={48} />
                    </button>

                    {/* Down Scroll */}
                    <button 
                        onClick={() => handleRemoteScroll('down')}
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-20 md:w-32 md:h-24 bg-slate-800 hover:bg-slate-700 active:bg-indigo-600 rounded-b-3xl border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95 shadow-lg"
                    >
                        <ChevronDown size={48} />
                    </button>

                    {/* Prev Block */}
                    <button 
                        onClick={() => handleNavigate('prev')}
                        disabled={currentIndex === 0}
                        className="absolute top-1/2 left-0 -translate-y-1/2 w-20 h-24 md:w-24 md:h-32 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 active:bg-fuchsia-600 rounded-l-3xl border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95 shadow-lg"
                    >
                        <ChevronLeft size={40} />
                    </button>

                    {/* Next Block */}
                    <button 
                        onClick={() => handleNavigate('next')}
                        disabled={currentIndex === blocks.length - 1}
                        className="absolute top-1/2 right-0 -translate-y-1/2 w-20 h-24 md:w-24 md:h-32 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 active:bg-fuchsia-600 rounded-r-3xl border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95 shadow-lg"
                    >
                        <ChevronRight size={40} />
                    </button>

                    {/* Center Core */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-slate-950 rounded-full border-4 border-slate-800 flex items-center justify-center shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                        <div className={`w-4 h-4 rounded-full ${isTransmitting ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)]' : 'bg-slate-800'} transition-all duration-300`} />
                    </div>

                </div>
            </div>

            {/* --- CONTEXTUAL FOOTER (Displays live data if the current block is a quiz) --- */}
            <div className="h-32 bg-slate-900 border-t border-slate-800 p-4 overflow-y-auto custom-scrollbar shrink-0">
                {currentBlock?.type === 'quiz' || currentBlock?.type === 'interactive' ? (
                    <div className="flex flex-col h-full">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Activity size={12} /> Live Quiz Telemetry
                        </span>
                        <div className="text-xs text-slate-400">
                            Waiting for students to submit answers... (SpeedModerator injection point coming soon).
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-50">
                        <CheckCircle2 size={24} className="mb-1" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Standard Content Block</span>
                    </div>
                )}
            </div>

        </div>
    );
}
