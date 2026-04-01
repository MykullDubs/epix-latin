// src/components/InstructorHUD.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { doc, updateDoc } from 'firebase/firestore'; 
import { db, appId } from '../config/firebase';
import { useLiveClass } from '../hooks/useLiveClass';
import { 
    ChevronLeft, ChevronRight, Zap, Eye, EyeOff, X, 
    MessageSquare, Users, ShieldAlert, CheckCircle2 
} from 'lucide-react';
import HoloAvatar from './HoloAvatar';

export default function InstructorHUD({ lesson, classId, activeClass, onExit }: any) {
    const { liveState, changeSlide, triggerQuiz } = useLiveClass(classId, false); // false = don't overwrite teacher's own presence
    const [activePageIdx, setActivePageIdx] = useState(liveState?.currentBlockIndex || 0);

    // Keep HUD in sync if another device changes the slide
    useEffect(() => {
        if (liveState?.currentBlockIndex !== undefined) {
            setActivePageIdx(liveState.currentBlockIndex);
        }
    }, [liveState?.currentBlockIndex]);

    const pages = useMemo(() => {
        if (!lesson?.blocks) return [];
        const grouped: any[] = [];
        let buffer: any[] = [];
        const interactables = ['quiz', 'scenario', 'fill-blank', 'discussion', 'game', 'drag-drop'];
        
        lesson.blocks.forEach((b: any) => {
            if (interactables.includes(String(b?.type))) {
                if (buffer.length > 0) grouped.push({ type: 'read', blocks: [...buffer] });
                grouped.push({ type: 'interact', blocks: [b] });
                buffer = [];
            } else { buffer.push(b); }
        });
        if (buffer.length > 0) grouped.push({ type: 'read', blocks: [...buffer] });
        return grouped;
    }, [lesson]);

    const handleNext = () => {
        if (activePageIdx < pages.length - 1) {
            const nextIdx = activePageIdx + 1;
            setActivePageIdx(nextIdx);
            changeSlide(nextIdx);
        }
    };

    const handlePrev = () => {
        if (activePageIdx > 0) {
            const prevIdx = activePageIdx - 1;
            setActivePageIdx(prevIdx);
            changeSlide(prevIdx);
        }
    };

    // 🔥 THE MODERATION ENGINE
    const toggleApproval = async (email: string, text: string, isApproved: boolean) => {
        const sessionRef = doc(db, 'artifacts', appId, 'live_sessions', classId);
        const currentApproved = liveState?.approvedAnswers || {};
        
        const newApproved = { ...currentApproved };
        if (isApproved) {
            delete newApproved[email]; // Revoke
        } else {
            newApproved[email] = text; // Approve and push to board
        }

        await updateDoc(sessionRef, { approvedAnswers: newApproved });
    };

    const activePage = pages[activePageIdx];
    const isInteractable = activePage?.type === 'interact';
    const currentBlock = isInteractable ? activePage.blocks[0] : null;
    const isDiscussion = currentBlock?.type === 'discussion';
    
    const answers = liveState?.answers || {};
    const approvedAnswers = liveState?.approvedAnswers || {};
    const joinedStudents = liveState?.joined || {};

    return (
        <div className="fixed inset-0 bg-slate-950 text-white flex flex-col font-sans z-[9999] overflow-hidden">
            {/* Header */}
            <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-3">
                    <ShieldAlert className="text-rose-500" size={24} />
                    <span className="font-black tracking-widest uppercase text-sm text-slate-300">Teacher HUD</span>
                </div>
                <button onClick={onExit} className="p-2 bg-slate-800 hover:bg-rose-600 rounded-full transition-colors"><X size={20} /></button>
            </header>

            {/* Main Telemetry Area */}
            <main className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-6 pb-32">
                
                {/* Current Slide Context */}
                <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
                    <span className="text-xs font-black uppercase tracking-widest text-indigo-500 block mb-2">Slide {activePageIdx + 1} of {pages.length}</span>
                    <h2 className="text-xl font-bold text-slate-200 line-clamp-2">
                        {currentBlock?.title || currentBlock?.question || "Reading / Content Slide"}
                    </h2>
                </div>

                {/* Live Quiz Controls */}
                {currentBlock?.type === 'quiz' && (
                    <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 flex flex-col gap-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-black uppercase tracking-widest text-slate-400">Quiz Status</span>
                            <span className="bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-md text-xs font-bold">{Object.keys(answers).length} Locked In</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => triggerQuiz('active')} className={`py-4 rounded-xl font-black uppercase tracking-widest flex flex-col items-center gap-2 transition-all ${liveState?.quizState === 'active' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400'}`}>
                                <Zap size={24} /> Launch
                            </button>
                            <button onClick={() => triggerQuiz('revealed')} className={`py-4 rounded-xl font-black uppercase tracking-widest flex flex-col items-center gap-2 transition-all ${liveState?.quizState === 'revealed' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400'}`}>
                                <CheckCircle2 size={24} /> Reveal
                            </button>
                        </div>
                    </div>
                )}

                {/* 🔥 THE MODERATION QUEUE */}
                {isDiscussion && (
                    <div className="flex flex-col gap-4">
                        <h3 className="font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <MessageSquare size={18} /> Moderation Queue
                        </h3>
                        {Object.entries(answers).length === 0 ? (
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-500 font-bold">Waiting for student responses...</div>
                        ) : (
                            Object.entries(answers).map(([email, text]: any) => {
                                const isApproved = !!approvedAnswers[email];
                                const student = joinedStudents[email] || activeClass?.students?.find((s:any) => s.email.replace(/\./g, ',') === email);
                                
                                return (
                                    <div key={email} className={`p-5 rounded-3xl border-2 transition-all flex gap-4 items-start ${isApproved ? 'bg-indigo-900/40 border-indigo-500' : 'bg-slate-900 border-slate-800'}`}>
                                        <HoloAvatar student={student || { name: email.split('@')[0] }} size="sm" />
                                        <div className="flex-1">
                                            <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1">{student?.name || email.split('@')[0]}</p>
                                            <p className="text-sm font-medium text-slate-200 leading-relaxed">{text}</p>
                                        </div>
                                        <button 
                                            onClick={() => toggleApproval(email, text, isApproved)}
                                            className={`p-4 rounded-2xl transition-all shadow-lg active:scale-95 ${isApproved ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                        >
                                            {isApproved ? <Eye size={24} /> : <EyeOff size={24} />}
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </main>

            {/* Giant Sticky Thumb Controls */}
            <footer className="absolute bottom-0 left-0 right-0 p-6 bg-slate-950 border-t border-slate-800 flex justify-between gap-4 pb-8">
                <button onClick={handlePrev} disabled={activePageIdx === 0} className="flex-1 bg-slate-800 disabled:opacity-30 text-white py-6 rounded-[2rem] flex items-center justify-center transition-transform active:scale-95">
                    <ChevronLeft size={40} />
                </button>
                <button onClick={handleNext} disabled={activePageIdx === pages.length - 1} className="flex-1 bg-indigo-600 disabled:opacity-30 text-white py-6 rounded-[2rem] flex items-center justify-center transition-transform active:scale-95 shadow-[0_0_30px_rgba(99,102,241,0.4)]">
                    <ChevronRight size={40} />
                </button>
            </footer>
        </div>
    );
}
