// src/components/instructor/DeploymentModal.tsx
import React, { useState } from 'react';
import { 
    X, Send, Search, Layers, FileText, 
    Milestone, ShieldCheck, Zap, Target 
} from 'lucide-react';

export default function DeploymentModal({ 
    isOpen, 
    onClose, 
    onDeploy, 
    activeClass, 
    lessons = [], 
    allDecks = {}, 
    curriculums = [] 
}: any) {
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<'deck' | 'lesson' | 'curriculum'>('deck');

    if (!isOpen) return null;

    // Flatten and categorize content
    const decksArray = Object.entries(allDecks).map(([id, d]: any) => ({ ...d, id, type: 'deck' }));
    const allContent = [
        ...decksArray,
        ...lessons.map((l: any) => ({ ...l, type: 'lesson' })),
        ...curriculums.map((c: any) => ({ ...c, type: 'curriculum' }))
    ];

    const filteredContent = allContent.filter(item => 
        (item.title || item.name || '').toLowerCase().includes(search.toLowerCase()) &&
        item.type === selectedType
    );

    const handleDeploy = () => {
        if (!selectedId) return;
        onDeploy(activeClass.id, { id: selectedId, type: selectedType });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
            
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 fade-in duration-300">
                
                {/* Header */}
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-3">
                            <Target size={24} className="text-indigo-500" /> Initialize Deployment
                        </h2>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                            Targeting Cohort: <span className="text-indigo-500">{activeClass?.name}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white dark:bg-slate-800 rounded-full text-slate-400 hover:text-rose-500 transition-colors shadow-sm">
                        <X size={20} strokeWidth={3} />
                    </button>
                </div>

                {/* Content Picker */}
                <div className="p-8 flex flex-col h-[500px]">
                    {/* Tabs */}
                    <div className="flex gap-2 mb-6">
                        {[
                            { id: 'deck', label: 'Flash Decks', icon: Layers },
                            { id: 'lesson', label: 'Lessons', icon: FileText },
                            { id: 'curriculum', label: 'Pathways', icon: Milestone }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => { setSelectedType(tab.id as any); setSelectedId(null); }}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                                    selectedType === tab.id 
                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                                    : 'bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                <tab.icon size={14} /> {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Scan content database..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:border-indigo-500 outline-none text-sm font-bold text-slate-700 dark:text-white transition-all"
                        />
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                        {filteredContent.length > 0 ? filteredContent.map((item: any) => (
                            <button
                                key={item.id}
                                onClick={() => setSelectedId(item.id)}
                                className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all group ${
                                    selectedId === item.id 
                                    ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500' 
                                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-500/30'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-xl ${selectedId === item.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                        {selectedType === 'deck' ? <Layers size={18} /> : selectedType === 'lesson' ? <FileText size={18} /> : <Milestone size={18} />}
                                    </div>
                                    <div className="text-left">
                                        <p className={`text-sm font-black ${selectedId === item.id ? 'text-indigo-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {item.title || item.name}
                                        </p>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {item.cards?.length || item.steps?.length || 0} Components
                                        </span>
                                    </div>
                                </div>
                                {selectedId === item.id && <ShieldCheck size={20} className="text-indigo-500 animate-in zoom-in" />}
                            </button>
                        )) : (
                            <div className="h-full flex flex-col items-center justify-center opacity-20 py-12">
                                <Zap size={48} className="mb-4" />
                                <p className="font-black uppercase tracking-widest text-xs">No matching content found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                        <Zap size={14} className="animate-pulse text-amber-500" />
                        <span className="text-[9px] font-black uppercase tracking-widest italic">Syncing with Magister Cloud</span>
                    </div>
                    <button 
                        onClick={handleDeploy}
                        disabled={!selectedId}
                        className="w-full sm:w-auto px-10 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        <Send size={16} /> Finalize Deployment
                    </button>
                </div>
            </div>
        </div>
    );
}
