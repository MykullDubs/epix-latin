// src/components/instructor/LiveSetupModal.tsx
import React, { useState } from 'react';
import { X, Zap, LayoutGrid, Play, Users, BookOpen, Shield, Gauge } from 'lucide-react'; // 🔥 Added Gauge for Slipstream

export default function LiveSetupModal({ isOpen, onClose, classes = [], decks = [], onDeploy }: any) {
    // 🔥 Added 'slipstream' to the allowed modes
    const [selectedMode, setSelectedMode] = useState<'trivia' | 'connect_four' | 'slipstream' | null>(null);
    const [selectedContent, setSelectedContent] = useState<string>('');
    const [selectedClass, setSelectedClass] = useState<string>('');

    if (!isOpen) return null;

    const handleDeploy = () => {
        if (!selectedMode || !selectedContent || !selectedClass) return;
        onDeploy({
            mode: selectedMode,
            contentId: selectedContent,
            classId: selectedClass
        });
        // Reset state for next time
        setSelectedMode(null);
        setSelectedContent('');
        setSelectedClass('');
    };

    const isReady = selectedMode && selectedContent && selectedClass;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-4xl bg-white dark:bg-slate-950 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                
                {/* Header */}
                <div className="shrink-0 p-6 md:p-8 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shadow-inner dark:shadow-none">
                            <Play size={20} fill="currentColor" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Deploy Live Arena</h2>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Configure Multiplayer Protocol</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 rounded-full shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-700 transition-colors">
                        <X size={20} strokeWidth={3} />
                    </button>
                </div>

                {/* Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
                    
                    {/* STEP 1: Game Mode */}
                    <section>
                        <h3 className="text-xs font-black text-slate-800 dark:text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center text-[10px]">1</span> 
                            Select Protocol
                        </h3>
                        {/* 🔥 Grid updated to 3 columns to fit the new mode */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <button 
                                onClick={() => setSelectedMode('trivia')}
                                className={`p-6 rounded-[2rem] border-4 text-left transition-all active:scale-[0.98] ${selectedMode === 'trivia' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 shadow-lg shadow-emerald-500/20' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-200 dark:hover:border-emerald-500/50'}`}
                            >
                                <Zap size={32} className={`mb-4 ${selectedMode === 'trivia' ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`} fill={selectedMode === 'trivia' ? "currentColor" : "none"} />
                                <h4 className={`text-xl font-black mb-1 ${selectedMode === 'trivia' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-white'}`}>Speed Trivia</h4>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Fast-paced, individual multiple-choice arena. Highest accuracy and speed wins.</p>
                            </button>

                            <button 
                                onClick={() => setSelectedMode('connect_four')}
                                className={`p-6 rounded-[2rem] border-4 text-left transition-all active:scale-[0.98] ${selectedMode === 'connect_four' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 shadow-lg shadow-indigo-500/20' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-200 dark:hover:border-indigo-500/50'}`}
                            >
                                <LayoutGrid size={32} className={`mb-4 ${selectedMode === 'connect_four' ? 'text-indigo-500' : 'text-slate-300 dark:text-slate-600'}`} />
                                <h4 className={`text-xl font-black mb-1 ${selectedMode === 'connect_four' ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-800 dark:text-white'}`}>Squad Strike</h4>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Team-based tactical Connect Four. Answer correctly to unlock tactical drops.</p>
                            </button>

                            {/* 🔥 NEW SLIPSTREAM BUTTON */}
                            <button 
                                onClick={() => setSelectedMode('slipstream')}
                                className={`p-6 rounded-[2rem] border-4 text-left transition-all active:scale-[0.98] ${selectedMode === 'slipstream' ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-500/10 shadow-lg shadow-cyan-500/20' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-cyan-200 dark:hover:border-cyan-500/50'}`}
                            >
                                <Gauge size={32} className={`mb-4 ${selectedMode === 'slipstream' ? 'text-cyan-500' : 'text-slate-300 dark:text-slate-600'}`} />
                                <h4 className={`text-xl font-black mb-1 ${selectedMode === 'slipstream' ? 'text-cyan-700 dark:text-cyan-400' : 'text-slate-800 dark:text-white'}`}>Slipstream</h4>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Self-paced cyber race. Students pull the deck locally and race to the finish line.</p>
                            </button>
                        </div>
                    </section>

                    {/* STEP 2 & 3: Configuration */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <section>
                            <h3 className="text-xs font-black text-slate-800 dark:text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center text-[10px]">2</span> 
                                Target Content
                            </h3>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <BookOpen size={18} />
                                </div>
                                <select 
                                    value={selectedContent}
                                    onChange={(e) => setSelectedContent(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-white font-bold rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-colors appearance-none cursor-pointer shadow-sm"
                                >
                                    <option value="" disabled>Select a Deck...</option>
                                    {Object.entries(decks).map(([id, deck]: any) => (
                                        <option key={id} value={id}>{deck.title}</option>
                                    ))}
                                </select>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xs font-black text-slate-800 dark:text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center text-[10px]">3</span> 
                                Target Cohort
                            </h3>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Shield size={18} />
                                </div>
                                <select 
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-white font-bold rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-colors appearance-none cursor-pointer shadow-sm"
                                >
                                    <option value="" disabled>Select a Class...</option>
                                    {classes.map((c: any) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </section>
                    </div>

                </div>

                {/* Footer / Action */}
                <div className="shrink-0 p-6 md:p-8 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
                    <button 
                        onClick={handleDeploy}
                        disabled={!isReady}
                        className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 ${
                            isReady 
                            ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-xl shadow-indigo-500/30 hover:bg-indigo-700 dark:hover:bg-indigo-400' 
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                        }`}
                    >
                        <Zap size={18} fill={isReady ? "currentColor" : "none"} />
                        Initialize Protocol
                    </button>
                </div>

            </div>
        </div>
    );
}
