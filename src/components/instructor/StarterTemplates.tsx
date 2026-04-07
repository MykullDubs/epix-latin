// src/components/instructor/StarterTemplates.tsx
import React, { useState } from 'react';
import { 
    Copy, Utensils, Shield, Dna, Globe2, 
    ChevronRight, Sparkles, Loader2, Library
} from 'lucide-react';

const PREMADE_TEMPLATES = [
    {
        id: 'tpl_esl_kitchen',
        title: 'ESL: Kitchen Communication',
        description: 'Essential vocabulary and safety phrases for back-of-house restaurant staff.',
        category: 'Language / ESL',
        icon: Utensils,
        theme: 'emerald',
        cardCount: 24,
        gradient: 'from-emerald-500 to-teal-600',
        cards: [
            { front: "Cuchillo", back: "Knife", type: "noun", ipa: "/naɪf/" },
            { front: "Detrás de ti!", back: "Behind you!", type: "phrase", ipa: "/bɪˈhaɪnd ju/" },
            { front: "Caliente!", back: "Hot!", type: "adjective", ipa: "/hɒt/" }
        ]
    },
    {
        id: 'tpl_lore_40k',
        title: 'Grimdark Lore: Factions',
        description: 'A deep dive into the history, heroes, and horrors of the 41st Millennium.',
        category: 'Pop Culture / Trivia',
        icon: Shield,
        theme: 'rose',
        cardCount: 42,
        gradient: 'from-rose-500 to-red-700',
        cards: [
            { front: "The Emperor", back: "The Master of Mankind", type: "noun" },
            { front: "Astartes", back: "Space Marines", type: "noun" }
        ]
    },
    {
        id: 'tpl_bio_cells',
        title: 'Cellular Mitosis',
        description: 'Interactive biology module covering the stages of cell division.',
        category: 'STEM',
        icon: Dna,
        theme: 'indigo',
        cardCount: 15,
        gradient: 'from-indigo-500 to-blue-600',
        cards: [
            { front: "Prophase", back: "Chromosomes condense and become visible", type: "noun" },
            { front: "Anaphase", back: "Sister chromatids are pulled apart", type: "noun" }
        ]
    },
    {
        id: 'tpl_span_101',
        title: 'Spanish 101: Travel',
        description: 'Basic navigational and conversational phrases for visiting Mexico or Spain.',
        category: 'Language',
        icon: Globe2,
        theme: 'amber',
        cardCount: 30,
        gradient: 'from-amber-400 to-orange-600',
        cards: [
            { front: "¿Dónde está el baño?", back: "Where is the bathroom?", type: "phrase" },
            { front: "Aeropuerto", back: "Airport", type: "noun" }
        ]
    }
];

export default function StarterTemplates({ onCloneTemplate }: { onCloneTemplate: (deckData: any) => Promise<void> }) {
    const [cloningId, setCloningId] = useState<string | null>(null);

    const handleClone = async (template: any) => {
        setCloningId(template.id);
        
        // Structure the payload exactly how your Firebase expects a new deck
        const clonedDeck = {
            title: template.title,
            description: template.description,
            type: 'vocabulary',
            isPublished: false,
            visibility: 'private',
            stats: { cardCount: template.cardCount },
            cards: template.cards // This would be populated by your actual template data
        };

        // Simulate network delay for the sleek UI feel
        setTimeout(async () => {
            await onCloneTemplate(clonedDeck);
            setCloningId(null);
        }, 800);
    };

    return (
        <div className="w-full max-w-6xl mx-auto px-6 py-12 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4">
                        <Sparkles size={14} className="text-indigo-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Quick Start</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                        Deploy a Starter Pack
                    </h2>
                    <p className="text-slate-400 font-medium mt-2 max-w-xl">
                        Don't start from scratch. Clone a high-quality, pre-configured module directly into your vault and customize it for your classroom.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {PREMADE_TEMPLATES.map((tpl) => {
                    const isCloning = cloningId === tpl.id;
                    const Icon = tpl.icon;

                    return (
                        <div key={tpl.id} className="bg-slate-900 rounded-[2rem] border border-slate-800 p-6 flex flex-col h-full relative overflow-hidden group hover:border-slate-700 transition-colors shadow-lg">
                            {/* Ambient Glow */}
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${tpl.gradient} rounded-full blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none`} />
                            
                            <div className="relative z-10 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg bg-gradient-to-br ${tpl.gradient}`}>
                                        <Icon size={24} />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
                                        {tpl.category}
                                    </span>
                                </div>
                                
                                <h3 className="text-xl font-black text-white mb-2 leading-snug">{tpl.title}</h3>
                                <p className="text-sm font-medium text-slate-400 mb-6 flex-1">{tpl.description}</p>
                                
                                <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-800">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                        <Library size={14} /> {tpl.cardCount} Targets
                                    </span>
                                    
                                    <button 
                                        onClick={() => handleClone(tpl)}
                                        disabled={isCloning || (cloningId !== null)}
                                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 active:scale-95 ${
                                            isCloning 
                                                ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]' 
                                                : 'bg-white text-slate-900 hover:bg-slate-200'
                                        } disabled:opacity-50 disabled:hover:bg-white`}
                                    >
                                        {isCloning ? (
                                            <><Loader2 size={14} className="animate-spin" /> Cloning...</>
                                        ) : (
                                            <>Clone <Copy size={14} /></>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
