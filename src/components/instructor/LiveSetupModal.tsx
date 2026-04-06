// src/components/instructor/LiveSetupModal.tsx
import React, { useState, useEffect } from 'react';
import { 
    X, Play, Users, Layers, MonitorPlay, 
    Gamepad2, Brain, Zap, TabletSmartphone, BookOpen, Lock 
} from 'lucide-react';

export default function LiveSetupModal({ isOpen, onClose, classes = [], decks = {}, lessons = [], onDeploy, preselectedContent }: any) {
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedMode, setSelectedMode] = useState<'hud' | 'presentation' | 'trivia' | 'connect_four' | 'slipstream' | ''>('');
    const [selectedContentId, setSelectedContentId] = useState('');

    // 🔥 Auto-hydrate the modal if opened from the Vault
    useEffect(() => {
        if (isOpen) {
            setSelectedClassId('');
            if (preselectedContent) {
                setSelectedContentId(preselectedContent.id);
                setSelectedMode(preselectedContent.type === 'lesson' ? 'presentation' : 'trivia');
            } else {
                setSelectedMode('');
                setSelectedContentId('');
            }
        }
    }, [isOpen, preselectedContent]);

    if (!isOpen) return null;

    const availableDecks = Object.values(decks || {}).filter((d: any) => d.id && d.id !== 'custom');
    
    const requiresLesson = selectedMode === 'hud' || selectedMode === 'presentation';
    const requiresDeck = selectedMode === 'trivia' || selectedMode === 'connect_four' || selectedMode === 'slipstream';

    const handleDeploy = () => {
        if (!selectedClassId || !selectedMode || !selectedContentId) return;
        onDeploy({
            classId: selectedClassId,
            mode: selectedMode,
            contentId: selectedContentId
        });
    };

    const getLockedTitle = () => {
        if (requiresLesson) {
            return lessons.find((l:any) => l.id === selectedContentId)?.title || "Selected Lesson Payload";
        } else {
            const targetDeck = Object.values(decks || {}).find((d:any) => d.id === selectedContentId) as any;
            return targetDeck?.title || targetDeck?.name || "Selected Data Crystal";
        }
    };

    const ModeButton = ({ id, icon: Icon, label, type, colorClass }: any) => {
        const isSelected = selectedMode === id;
        return (
            <button 
                onClick={() => {
                    const newModeRequiresLesson = id === 'hud' || id === 'presentation';
                    const currentModeRequiresLesson = selectedMode === 'hud' || selectedMode === 'presentation';
                    setSelectedMode(id);
                    
                    if (newModeRequiresLesson !== currentModeRequiresLesson) {
                        setSelectedContentId(''); 
                    }
                }}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 text-center ${
                    isSelected 
                        ? `${colorClass} shadow-lg scale-105` 
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
            >
                <Icon size={24} />
                <div>
                    <div className="text-xs font-black uppercase tracking-widest">{label}</div>
                    <div className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-0.5">Requires {type}</div>
                </div>
            </button>
        );
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Initialize Live Session</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Configure Deployment Parameters</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-200 dark:bg-slate-800 rounded-full text-slate-500 hover:text-rose-500 transition-colors active:scale-90">
                        <X size={20} strokeWidth={3} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
                    
                    {/* STEP 1: TARGET COHORT */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
                            <Users size={14} /> 1. Target Cohort
                        </label>
                        <select 
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-2xl px-5 py-4 outline-none focus:border-indigo-500 transition-all"
                        >
                            <option value="" disabled>Select a class...</option>
                            {/* 🔥 NEW: Quick Launch / Sandbox Option */}
                            <option value="sandbox" className="font-black text-amber-600">⚡ Quick Launch (Test / Guest Mode)</option>
                            <optgroup label="Your Cohorts">
                                {classes.map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </optgroup>
                        </select>
                    </div>

                    {/* STEP 2: SESSION MODE */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
                            <Zap size={14} /> 2. Operating Mode
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <ModeButton id="hud" icon={TabletSmartphone} label="Instructor HUD" type="Lesson" colorClass="bg-indigo-600 border-indigo-500 text-white" />
                            <ModeButton id="presentation" icon={MonitorPlay} label="Live Projector" type="Lesson" colorClass="bg-indigo-600 border-indigo-500 text-white" />
                            <ModeButton id="trivia" icon={Brain} label="Arena: Trivia" type="Deck" colorClass="bg-fuchsia-600 border-fuchsia-500 text-white" />
                            <ModeButton id="connect_four" icon={Gamepad2} label="Squad Strike" type="Deck" colorClass="bg-emerald-600 border-emerald-500 text-white" />
                            <ModeButton id="slipstream" icon={Zap} label="Slipstream" type="Deck" colorClass="bg-amber-500 border-amber-400 text-white" />
                        </div>
                    </div>

                    {/* STEP 3: PAYLOAD */}
                    {selectedMode && (
                        <div className="space-y-3 animate-in slide-in-from-top-4 duration-300">
                            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
                                {requiresLesson ? <BookOpen size={14} /> : <Layers size={14} />} 
                                3. {preselectedContent && selectedContentId === preselectedContent.id ? 'Locked Payload' : `Select ${requiresLesson ? 'Lesson Payload' : 'Data Crystal (Deck)'}`}
                            </label>
                            
                            {preselectedContent && selectedContentId === preselectedContent.id ? (
                                <div className="w-full bg-indigo-50 dark:bg-indigo-500/10 border-2 border-indigo-200 dark:border-indigo-500/30 text-indigo-800 dark:text-indigo-200 font-bold rounded-2xl px-5 py-4 flex items-center justify-between shadow-inner">
                                    <span className="truncate pr-4 text-sm md:text-base">{getLockedTitle()}</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-200 dark:bg-indigo-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shrink-0"><Lock size={12} /> Ready</span>
                                </div>
                            ) : (
                                <select 
                                    value={selectedContentId}
                                    onChange={(e) => setSelectedContentId(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-2xl px-5 py-4 outline-none focus:border-indigo-500 transition-all"
                                >
                                    <option value="" disabled>Select content to deploy...</option>
                                    {requiresLesson ? (
                                        lessons.map((l: any) => <option key={l.id} value={l.id}>{l.title}</option>)
                                    ) : (
                                        availableDecks.map((d: any) => <option key={d.id} value={d.id}>{d.title || d.name}</option>)
                                    )}
                                </select>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 shrink-0">
                    <button 
                        onClick={handleDeploy}
                        disabled={!selectedClassId || !selectedMode || !selectedContentId}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-2xl font-black text-lg uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 disabled:shadow-none"
                    >
                        <Play size={20} fill="currentColor" /> Initialize Sequence
                    </button>
                </div>
            </div>
        </div>
    );
}
