// src/components/instructor/LiveSetupModal.tsx
import React, { useState } from 'react';
import { X, Users, Layers, Zap, Gamepad2, Shield, Rocket, Target, Activity } from 'lucide-react';

export default function LiveSetupModal({ isOpen, onClose, classes = [], decks = {}, onDeploy }: any) {
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedMode, setSelectedMode] = useState<'trivia' | 'connect_four' | 'slipstream'>('trivia');
    const [selectedDeckId, setSelectedDeckId] = useState('');

    if (!isOpen) return null;

    // 🔥 Filter the dictionary into an array, ignoring the placeholder "custom" deck
    const availableDecks = Object.values(decks || {}).filter((d: any) => d.id && d.id !== 'custom');

    const handleLaunch = () => {
        if (!selectedClassId) return alert("Commander, you must select a Target Cohort to deploy.");
        if (!selectedDeckId) return alert("You must select a Data Crystal (Study Deck) to power the arena's questions.");
        
        // 🔥 This EXACT payload structure is what InstructorDashboard is waiting for
        onDeploy({ 
            mode: selectedMode, 
            classId: selectedClassId, 
            contentId: selectedDeckId 
        });
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300 font-sans">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
            
            <div className="bg-slate-900 border-2 border-indigo-500/30 w-full max-w-3xl rounded-[3rem] shadow-[0_0_50px_rgba(99,102,241,0.2)] relative z-10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                
                {/* Header */}
                <div className="p-8 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent pointer-events-none" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-14 h-14 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center shadow-inner border border-indigo-500/30">
                            <Rocket size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-widest leading-none">Arena Deployment</h2>
                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.3em] mt-1">Initialize Live Protocol</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-full transition-all relative z-10">
                        <X size={24} strokeWidth={2.5} />
                    </button>
                </div>

                <div className="p-8 flex-1 overflow-y-auto custom-scrollbar space-y-8">
                    
                    {/* Step 1: Mode Selection */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Gamepad2 size={16} /> 1. Select Arena Protocol
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <button 
                                onClick={() => setSelectedMode('trivia')}
                                className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center text-center gap-3 ${selectedMode === 'trivia' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400 shadow-[inset_0_0_20px_rgba(99,102,241,0.2)]' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'}`}
                            >
                                <Zap size={32} className={selectedMode === 'trivia' ? 'text-indigo-400' : 'text-slate-600'} />
                                <span className="font-black uppercase tracking-widest text-sm">Vocab Battle</span>
                            </button>
                            <button 
                                onClick={() => setSelectedMode('connect_four')}
                                className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center text-center gap-3 ${selectedMode === 'connect_four' ? 'bg-rose-600/20 border-rose-500 text-rose-400 shadow-[inset_0_0_20px_rgba(244,63,94,0.2)]' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'}`}
                            >
                                <Target size={32} className={selectedMode === 'connect_four' ? 'text-rose-400' : 'text-slate-600'} />
                                <span className="font-black uppercase tracking-widest text-sm">Squad Strike</span>
                            </button>
                            <button 
                                onClick={() => setSelectedMode('slipstream')}
                                className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center text-center gap-3 ${selectedMode === 'slipstream' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-[inset_0_0_20px_rgba(16,185,129,0.2)]' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'}`}
                            >
                                <Activity size={32} className={selectedMode === 'slipstream' ? 'text-emerald-400' : 'text-slate-600'} />
                                <span className="font-black uppercase tracking-widest text-sm">Slipstream</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Step 2: Cohort */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Users size={16} /> 2. Target Cohort
                            </h3>
                            <div className="space-y-2">
                                {classes.length === 0 ? (
                                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-500 text-sm font-bold text-center">No cohorts found.</div>
                                ) : (
                                    classes.map((c: any) => (
                                        <button 
                                            key={c.id} onClick={() => setSelectedClassId(c.id)}
                                            className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between text-left ${selectedClassId === c.id ? 'bg-indigo-600/20 border-indigo-500 shadow-sm' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                                        >
                                            <span className={`font-black text-sm uppercase tracking-widest ${selectedClassId === c.id ? 'text-indigo-400' : 'text-slate-300'}`}>{c.name}</span>
                                            {selectedClassId === c.id && <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Step 3: Ammo (Deck) */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Layers size={16} /> 3. Data Crystal (Ammo)
                            </h3>
                            <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                                {availableDecks.length === 0 ? (
                                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-500 text-sm font-bold text-center">No decks available.</div>
                                ) : (
                                    availableDecks.map((d: any) => (
                                        <button 
                                            key={d.id} onClick={() => setSelectedDeckId(d.id)}
                                            className={`w-full p-4 rounded-2xl border-2 transition-all flex flex-col text-left ${selectedDeckId === d.id ? 'bg-amber-500/10 border-amber-500 shadow-sm' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                                        >
                                            <span className={`font-black text-sm leading-tight mb-1 ${selectedDeckId === d.id ? 'text-amber-400' : 'text-slate-300'}`}>{d.title || d.name || 'Untitled Deck'}</span>
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{d.cards?.length || d.stats?.cardCount || 0} Targets</span>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-slate-950/50 border-t border-slate-800 shrink-0">
                    <button 
                        onClick={handleLaunch}
                        className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.5rem] font-black text-lg uppercase tracking-widest shadow-[0_0_30px_rgba(99,102,241,0.4)] active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        <Shield size={24} /> Authorize Deployment
                    </button>
                </div>
            </div>
        </div>
    );
}
