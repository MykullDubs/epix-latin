// src/components/instructor/ArcadeBuilderView.tsx
import React from 'react';
import { Gamepad2, Plus, Settings, Users, Bot, Trophy, Database, Check } from 'lucide-react';

// ============================================================================
//  ARCADE BUILDER (Game Template Configurator)
// ============================================================================
export default function ArcadeBuilderView({ data, setData, availableDecks = [] }: any) {
    
    // Ensure data has default structure if fresh
    const gameData = {
        title: data?.title || '',
        description: data?.description || '',
        gameTemplate: data?.gameTemplate || 'connect-three',
        targetScore: data?.targetScore || 3,
        mode: data?.mode || 'pvp', // 'pvp' (Pass & Play) or 'pvc' (Player vs CPU)
        deckIds: data?.deckIds || [],
        ...data
    };

    // 🛡️ BULLETPROOF ARRAYS: Converts objects/nulls into safe arrays
    const safeDecks = Array.isArray(availableDecks) ? availableDecks : Object.values(availableDecks || {});
    const safeDeckIds = Array.isArray(gameData.deckIds) ? gameData.deckIds : [];

    const updateField = (field: string, value: any) => {
        setData({ ...gameData, [field]: value });
    };

    const toggleDeck = (deckId: string) => {
        if (safeDeckIds.includes(deckId)) {
            updateField('deckIds', safeDeckIds.filter((id: string) => id !== deckId));
        } else {
            updateField('deckIds', [...safeDeckIds, deckId]);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-12 pb-64 animate-in fade-in duration-500">
            
            {/* 1. GAME META */}
            <div className="space-y-4 px-2">
                <input 
                    className="text-5xl md:text-6xl font-black border-none w-full focus:ring-0 p-0 placeholder:text-slate-200 tracking-tighter bg-transparent" 
                    placeholder="Game Title..." 
                    value={gameData.title} 
                    onChange={e => updateField('title', e.target.value)} 
                />
                <input 
                    className="text-xl md:text-2xl font-bold text-slate-400 border-none w-full focus:ring-0 p-0 tracking-tight bg-transparent" 
                    placeholder="Short description or instructions..." 
                    value={gameData.description} 
                    onChange={e => updateField('description', e.target.value)} 
                />
            </div>

            {/* 2. CHASSIS / TEMPLATE SELECTOR */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 flex items-center gap-2">
                    <Gamepad2 size={14} /> Select Game Chassis
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                        onClick={() => updateField('gameTemplate', 'connect-three')}
                        className={`p-6 rounded-[2rem] border-4 text-left transition-all ${gameData.gameTemplate === 'connect-three' ? 'border-indigo-500 bg-indigo-50 shadow-lg' : 'border-slate-100 bg-white hover:border-indigo-200'}`}
                    >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${gameData.gameTemplate === 'connect-three' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                            <Gamepad2 size={24} />
                        </div>
                        <h4 className="text-xl font-black text-slate-800 mb-1">Connect Three</h4>
                        <p className="text-xs font-bold text-slate-500 leading-snug">A strategic 4x5 grid battle powered by rapid vocabulary recall.</p>
                    </button>

                    <div className="p-6 rounded-[2rem] border-4 border-dashed border-slate-100 bg-slate-50/50 text-left opacity-70">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-slate-200 text-slate-400">
                            <Plus size={24} />
                        </div>
                        <h4 className="text-xl font-black text-slate-400 mb-1">Word Invaders</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">In Development</p>
                    </div>
                </div>
            </div>

            {/* 3. RULESET CONFIGURATOR */}
            <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm space-y-8">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-50 pb-4">
                    <Settings size={14} /> Ruleset & Mechanics
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-800 block">Opponent Type</label>
                        <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                            <button 
                                onClick={() => updateField('mode', 'pvp')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${gameData.mode === 'pvp' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <Users size={16}/> Pass & Play
                            </button>
                            <button 
                                onClick={() => updateField('mode', 'pvc')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${gameData.mode === 'pvc' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <Bot size={16}/> vs CPU
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                            Target Score to Win
                            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg flex items-center gap-1">
                                <Trophy size={14}/> {gameData.targetScore}
                            </span>
                        </label>
                        <input 
                            type="range" 
                            min="1" max="10" 
                            value={gameData.targetScore} 
                            onChange={(e) => updateField('targetScore', parseInt(e.target.value))}
                            className="w-full accent-indigo-600"
                        />
                    </div>
                </div>
            </div>

            {/* 4. DECK BINDING (The Ammo) */}
            <div className="space-y-4">
                <div className="flex justify-between items-end px-2">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Database size={14} /> Connect Vocabulary Decks
                    </h3>
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-md">
                        {safeDeckIds.length} Linked
                    </span>
                </div>
                
                {safeDecks.length === 0 ? (
                    <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl text-center">
                        <p className="text-sm font-bold text-rose-600">Create some flashcards first!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                        {safeDecks.map((deck: any) => {
                            const isLinked = safeDeckIds.includes(deck.id);
                            return (
                                <button 
                                    key={deck.id}
                                    onClick={() => toggleDeck(deck.id)}
                                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${isLinked ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-slate-100 bg-white hover:border-indigo-200'}`}
                                >
                                    <div>
                                        <h4 className={`font-bold text-sm ${isLinked ? 'text-indigo-900' : 'text-slate-700'}`}>{deck.title}</h4>
                                        <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${isLinked ? 'text-indigo-400' : 'text-slate-400'}`}>
                                            {deck.cards?.length || 0} Terms
                                        </p>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isLinked ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'}`}>
                                        {isLinked && <Check size={12} strokeWidth={4} />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
