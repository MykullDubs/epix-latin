// src/components/ContextualBuilder.tsx
import React, { useState } from 'react';
import { ArrowLeft, Layers, FolderOpen, Save, Loader2 } from 'lucide-react';

export default function ContextualBuilder({ config, onSave, onCancel }: any) {
    const isNewDeck = config.type === 'new_deck';
    const [deckTitle, setDeckTitle] = useState('');
    const [front, setFront] = useState('');
    const [back, setBack] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async () => {
        if (!front.trim() || !back.trim() || (isNewDeck && !deckTitle.trim())) return;
        setIsSaving(true);
        
        const finalDeckId = isNewDeck ? `custom_${Date.now()}` : config.deck.id;
        const finalTitle = isNewDeck ? deckTitle.trim() : config.deck.title;

        await onSave({ 
            front: front.trim(), 
            back: back.trim(), 
            deckId: finalDeckId, 
            deckTitle: finalTitle,
            type: 'note',
            ipa: '', 
            morphology: [{ part: front.trim(), meaning: 'Root', type: 'root' }],
            grammar_tags: ['Student Note']
        }, config.folder); 
        
        setIsSaving(false);
        onCancel(true); 
    };

    return (
        <div className="h-[100dvh] flex flex-col bg-slate-50 dark:bg-slate-950 absolute inset-0 z-[200] animate-in slide-in-from-bottom-8 duration-300">
            <div className="px-6 pt-safe-8 pb-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 shadow-sm z-10">
                <button onClick={() => onCancel(false)} className="flex items-center text-slate-400 hover:text-rose-500 mb-4 text-xs font-black uppercase tracking-widest transition-colors bg-slate-50 dark:bg-slate-800 px-5 py-2.5 rounded-full w-fit active:scale-95">
                    <ArrowLeft size={16} className="mr-2"/> Cancel
                </button>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                    {isNewDeck ? 'Forge New Deck' : 'Add Target Card'}
                </h1>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32 custom-scrollbar">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                    
                    {isNewDeck ? (
                        <div className="flex flex-col gap-2 pb-6 border-b border-slate-100 dark:border-slate-800">
                            <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest pl-1 flex justify-between">
                                <span>Deck Title</span>
                                {config.folder && <span className="text-slate-400 flex items-center gap-1"><FolderOpen size={12}/> {config.folder}</span>}
                            </label>
                            <input 
                                value={deckTitle} 
                                onChange={(e) => setDeckTitle(e.target.value)} 
                                placeholder="e.g., Biology Chapter 4" 
                                className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 dark:text-white font-bold focus:border-indigo-500 outline-none transition-colors text-lg"
                                autoFocus
                            />
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 pb-6 border-b border-slate-100 dark:border-slate-800">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20"><Layers size={18}/></div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Appending to</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-white line-clamp-1">{config.deck.title}</p>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest pl-1">Front (Target Concept)</label>
                        <input 
                            value={front} 
                            onChange={(e) => setFront(e.target.value)} 
                            placeholder="e.g., Mitosis" 
                            className="w-full p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-bold focus:border-indigo-500 outline-none transition-colors"
                            autoFocus={!isNewDeck}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest pl-1">Back (Definition / Note)</label>
                        <textarea 
                            value={back} 
                            onChange={(e) => setBack(e.target.value)} 
                            placeholder="e.g., Cellular division resulting in two identical cells." 
                            className="w-full p-4 h-32 rounded-xl border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-bold focus:border-indigo-500 outline-none transition-colors resize-none custom-scrollbar"
                        />
                    </div>
                </div>

                <button 
                    onClick={handleSubmit} 
                    disabled={!front.trim() || !back.trim() || (isNewDeck && !deckTitle.trim()) || isSaving}
                    className="w-full bg-indigo-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white p-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 mb-safe-8"
                >
                    {isSaving ? <Loader2 size={20} className="animate-spin"/> : <Save size={20}/>}
                    {isSaving ? 'Processing...' : isNewDeck ? 'Forge Deck & Save Card' : 'Save Card to Deck'}
                </button>
            </div>
        </div>
    );
}
