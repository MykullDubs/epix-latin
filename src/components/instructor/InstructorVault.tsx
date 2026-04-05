// src/components/instructor/InstructorVault.tsx
import React, { useState, useMemo } from 'react';
import { 
    Search, BookOpen, Layers, Clock, Edit3, 
    Play, ShieldAlert, ArrowDownAZ, LayoutGrid 
} from 'lucide-react';

export default function InstructorVault({ decks = {}, lessons = [], onLaunchLive, onEditArtifact }: any) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'lesson' | 'deck'>('all');
    const [sortBy, setSortBy] = useState<'recent' | 'alpha'>('recent');

    // 1. Normalize and combine Decks and Lessons into a single "Artifacts" pool
    const artifacts = useMemo(() => {
        const availableDecks = Object.values(decks || {}).filter((d: any) => d.id && d.id !== 'custom');
        
        const normalizedDecks = availableDecks.map((d: any) => ({
            ...d,
            artifactType: 'deck',
            displayTitle: d.title || d.name || 'Untitled Crystal',
            displayDesc: d.description || 'Flashcard data crystal.',
            metric: `${d.cards?.length || 0} Cards`,
            timestamp: d.updatedAt || d.createdAt || 0
        }));

        const normalizedLessons = lessons.map((l: any) => ({
            ...l,
            artifactType: 'lesson',
            displayTitle: l.title || 'Untitled Payload',
            displayDesc: l.description || 'Interactive lesson payload.',
            metric: `${l.blocks?.length || 0} Blocks`,
            timestamp: l.updatedAt || l.createdAt || 0
        }));

        return [...normalizedDecks, ...normalizedLessons];
    }, [decks, lessons]);

    // 2. Filter & Sort Engine
    const processedArtifacts = useMemo(() => {
        let result = [...artifacts];

        // Apply Search
        if (searchQuery.trim()) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(a => 
                a.displayTitle.toLowerCase().includes(lowerQuery) || 
                a.displayDesc.toLowerCase().includes(lowerQuery)
            );
        }

        // Apply Type Filter
        if (filterType !== 'all') {
            result = result.filter(a => a.artifactType === filterType);
        }

        // Apply Sort
        result.sort((a, b) => {
            if (sortBy === 'recent') {
                return b.timestamp - a.timestamp;
            } else {
                return a.displayTitle.localeCompare(b.displayTitle);
            }
        });

        return result;
    }, [artifacts, searchQuery, filterType, sortBy]);

    return (
        <div className="h-full flex flex-col max-w-7xl mx-auto w-full p-4 md:p-8 animate-in fade-in duration-500">
            
            {/* --- HEADER & CONTROLS --- */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">The Vault</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Manage and Deploy Artifacts</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Search Bar */}
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search archives..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-bold rounded-2xl pl-12 pr-4 py-3 outline-none focus:border-indigo-500 transition-all"
                        />
                    </div>

                    {/* Sort Dropdown */}
                    <div className="flex bg-slate-200 dark:bg-slate-800 p-1.5 rounded-2xl w-full sm:w-auto shrink-0">
                        <button onClick={() => setSortBy('recent')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${sortBy === 'recent' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                            <Clock size={14} /> Recent
                        </button>
                        <button onClick={() => setSortBy('alpha')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${sortBy === 'alpha' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                            <ArrowDownAZ size={14} /> A-Z
                        </button>
                    </div>
                </div>
            </div>

            {/* --- TYPE FILTERS --- */}
            <div className="flex gap-4 mb-8 overflow-x-auto custom-scrollbar pb-2">
                <button onClick={() => setFilterType('all')} className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 shrink-0 ${filterType === 'all' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-indigo-300'}`}>
                    <LayoutGrid size={16} /> All Artifacts
                </button>
                <button onClick={() => setFilterType('lesson')} className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 shrink-0 ${filterType === 'lesson' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-blue-300'}`}>
                    <BookOpen size={16} /> Lesson Payloads
                </button>
                <button onClick={() => setFilterType('deck')} className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 shrink-0 ${filterType === 'deck' ? 'bg-fuchsia-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-fuchsia-300'}`}>
                    <Layers size={16} /> Data Crystals
                </button>
            </div>

            {/* --- THE GRID --- */}
            {processedArtifacts.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-white/50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <ShieldAlert size={64} className="mb-4 text-slate-300 dark:text-slate-600" />
                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-2">No Artifacts Found</h3>
                    <p className="text-slate-500 font-bold max-w-sm">Adjust your search filters or construct a new payload in the Studio Hub.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pb-12">
                    {processedArtifacts.map((artifact) => {
                        const isLesson = artifact.artifactType === 'lesson';
                        const typeColor = isLesson ? 'text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30' : 'text-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-500/10 border-fuchsia-200 dark:border-fuchsia-500/30';
                        
                        return (
                            <div key={`${artifact.artifactType}_${artifact.id}`} className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 flex flex-col hover:border-indigo-400 dark:hover:border-indigo-500 transition-all hover:shadow-[0_10px_30px_rgba(99,102,241,0.15)] group relative overflow-hidden">
                                
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${typeColor}`}>
                                        {isLesson ? <BookOpen size={24} /> : <Layers size={24} />}
                                    </div>
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                        <Clock size={10} /> {new Date(artifact.timestamp || Date.now()).toLocaleDateString()}
                                    </div>
                                </div>

                                <div className="relative z-10 mb-6 flex-1">
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-2 line-clamp-1">{artifact.displayTitle}</h3>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 line-clamp-2">{artifact.displayDesc}</p>
                                </div>

                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 relative z-10">
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">{artifact.metric}</span>
                                    
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => onEditArtifact(artifact.id, artifact.artifactType)}
                                            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 flex items-center justify-center transition-colors"
                                            title="Edit Artifact"
                                        >
                                            <Edit3 size={16} strokeWidth={3} />
                                        </button>
                                        <button 
                                            onClick={() => onLaunchLive()}
                                            className="w-10 h-10 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 flex items-center justify-center transition-transform active:scale-90 shadow-md"
                                            title="Deploy to Classroom"
                                        >
                                            <Play size={16} fill="currentColor" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
